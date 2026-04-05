import * as cheerio from "cheerio";
import type { Bike } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

/**
 * Simply Bike adapter (simply.bike).
 * Simply Bike is a German online-only bike retailer and confirmed JobRad
 * partner. Their shop runs on Shopify, which serves server-rendered HTML
 * including JSON-LD product schema and standard Shopify product card markup.
 */
export class SimplyBikeAdapter extends BaseAdapter {
  readonly name = "Simply Bike";
  readonly cacheTtlMs = 6 * 60 * 60 * 1000;

  private baseUrl = "https://simply.bike";
  private searchUrls = [
    "/collections/e-bikes",
    "/collections/trekking-bikes",
    "/collections/city-bikes",
    "/collections/mountain-bikes",
    "/collections/road-bikes",
    "/collections/gravel-bikes",
    "/collections/kids-bikes",
    "/collections/cargo-bikes",
  ];

  async fetchBikes(): Promise<Bike[]> {
    const results = await Promise.allSettled(
      this.searchUrls.map(async (path) => {
        const html = await this.fetchPage(`${this.baseUrl}${path}?filter.p.tag=JobRad`);
        return this.parseListing(html, path);
      })
    );

    const allBikes: Bike[] = [];
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled") {
        allBikes.push(...result.value);
      } else {
        const path = this.searchUrls[i];
        console.error(`[Simply Bike] Error fetching ${path}:`, result.reason);
        this.recordError(result.reason instanceof Error ? result.reason.message : String(result.reason));
      }
    }
    return this.stampAndRecord(allBikes);
  }

  protected parseListing(html: string, categoryPath: string): Bike[] {
    const $ = cheerio.load(html);
    const bikes: Bike[] = [];

    // Shopify standard product card selectors — avoid .card-wrapper to prevent
    // double-matching inner divs that share a parent li[data-product-id]
    const cards = $(
      ".product-card, li.grid__item, " +
      "[data-product-id], .product-item"
    );
    const seenIds = new Set<string>();

    cards.each((_, el) => {
      try {
        const $el = $(el);

        const sourceId =
          $el.attr("data-product-id") ||
          $el.find("[data-product-id]").first().attr("data-product-id") ||
          undefined;
        if (sourceId && seenIds.has(sourceId)) return;
        if (sourceId) seenIds.add(sourceId);

        // Shopify: product title in .card__heading or .product-card__title
        const name =
          $el.find(".card__heading a, .product-card__title, .card-information__text a").first().text().trim() ||
          $el.find("h2 a, h3 a").first().text().trim();
        if (!name) return;

        // Shopify price: .price-item--sale for sale, .price-item--regular for regular
        const salePriceText =
          $el.find(".price-item--sale").first().text().trim();
        const regularPriceText =
          $el.find(".price-item--regular").first().text().trim();
        const priceText = salePriceText || regularPriceText;
        const price = this.parsePrice(priceText);
        if (!price) return;

        // Shopify crossed-out price: .price-item--regular when sale is active
        const listPriceText = salePriceText
          ? $el.find(".price-item--regular").first().text().trim()
          : "";
        const listPrice = listPriceText ? (this.parsePrice(listPriceText) ?? undefined) : undefined;

        const href = $el.find("a[href*='/products/']").first().attr("href") || "";
        const dealerUrl = href.startsWith("http") ? href : `${this.baseUrl}${href}`;
        if (!href) return;

        const imageUrl =
          $el.find("img").first().attr("data-src") ||
          $el.find("img").first().attr("src") ||
          undefined;

        const category = this.mapCategory(categoryPath.replace(/\//g, " ").replace("collections", ""));

        const result = BikeSchema.safeParse({
          name,
          brand: this.extractBrand(name),
          category,
          price: listPrice && price < listPrice ? price : price,
          listPrice: listPrice && listPrice > price ? listPrice : undefined,
          offerPrice: listPrice && price < listPrice ? price : undefined,
          dealer: this.name,
          dealerUrl,
          imageUrl,
          sourceId,
          sourceType: "scrape" as const,
          ...this.inferFromName(name),
        });
        if (result.success) bikes.push(result.data);
      } catch { /* skip malformed entries */ }
    });

    return bikes;
  }
}
