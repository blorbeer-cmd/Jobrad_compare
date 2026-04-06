import * as cheerio from "cheerio";
import type { Bike } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

/**
 * Hibike adapter (hibike.de).
 * Hibike runs on Shopware 6 which serves server-rendered HTML by default.
 * Selectors target the standard Shopware 6 product card structure.
 */
export class HibikeAdapter extends BaseAdapter {
  readonly name = "Hibike";
  readonly cacheTtlMs = 6 * 60 * 60 * 1000; // 6 hours

  private baseUrl = "https://www.hibike.de";
  private searchUrls = [
    "/c/e-bikes/",
    "/c/trekking-bikes/",
    "/c/city-bikes/",
    "/c/mountainbikes/",
    "/c/rennraeder/",
    "/c/gravelbikes/",
    "/c/kinderfahrraeder/",
    "/c/lastenraeder/",
  ];

  async fetchBikes(): Promise<Bike[]> {
    const results = await Promise.allSettled(
      this.searchUrls.map(async (path) => {
        const html = await this.fetchPage(`${this.baseUrl}${path}?jobrad=1`);
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
        console.error(`[Hibike] Error fetching ${path}:`, result.reason);
        this.recordError(result.reason instanceof Error ? result.reason.message : String(result.reason));
      }
    }
    return this.stampAndRecord(allBikes);
  }

  protected parseListing(html: string, categoryPath: string): Bike[] {
    const $ = cheerio.load(html);

    // Try JSON-LD first — many Shopware 6 shops include product schema
    const jsonLdBikes = this.parseJsonLdProducts($, categoryPath);
    if (jsonLdBikes.length > 0) return jsonLdBikes;

    const bikes: Bike[] = [];

    // Fallback: Shopware 6 product card selectors
    const cards = $("article.product-box, .product-box, [data-product-id]");
    const seenIds = new Set<string>();

    cards.each((_, el) => {
      try {
        const $el = $(el);

        const sourceId =
          $el.attr("data-product-id") ||
          $el.attr("data-id") ||
          undefined;
        if (sourceId && seenIds.has(sourceId)) return;
        if (sourceId) seenIds.add(sourceId);

        // Shopware 6 Storefront: <a class="product-name"> IS the anchor.
        // Also handle older pattern where anchor is nested inside .product-name.
        const name =
          $el.find("a.product-name").first().text().trim() ||
          $el.find(".product-name a, .product-info--name a").first().text().trim() ||
          $el.find("h2 a, h3 a").first().text().trim() ||
          $el.find(".product-name, .product-title").first().text().trim();
        if (!name) return;

        // Shopware 6 Storefront price selectors
        const priceText =
          $el.find(".price--default, .price-unit-value, .price--current").first().text().trim() ||
          $el.find(".product-price .price, .price").first().text().trim();
        const price = this.parsePrice(priceText);
        if (!price) return;

        // Crossed-out / old price
        const listPriceText =
          $el.find(".price--line-through, .price--strike, del, s").first().text().trim();
        const listPrice = listPriceText ? (this.parsePrice(listPriceText) ?? undefined) : undefined;

        // URL
        const href =
          $el.find("a.product-name, a[href*='/p/'], a[href]").first().attr("href") || "";
        const dealerUrl = href.startsWith("http") ? href : `${this.baseUrl}${href}`;
        if (!href) return;

        // Image
        const imageUrl =
          $el.find("img").first().attr("data-src") ||
          $el.find("img").first().attr("src") ||
          undefined;

        // Category from URL path
        const category = this.mapCategory(categoryPath.replace(/\//g, " "));

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
