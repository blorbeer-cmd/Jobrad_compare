import * as cheerio from "cheerio";
import type { Bike } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

/**
 * Radon Bikes adapter (radon-bikes.de).
 * Radon is a German direct-to-consumer brand (owned by Rose Bikes GmbH sister
 * company) and a confirmed JobRad partner. Their storefront is a custom React
 * app with SSR. Product data is embedded as JSON-LD on category pages.
 */
export class RadonAdapter extends BaseAdapter {
  readonly name = "Radon Bikes";
  readonly cacheTtlMs = 6 * 60 * 60 * 1000;

  private baseUrl = "https://www.radon-bikes.de";
  private searchUrls = [
    "/e-bike/",
    "/trekking/",
    "/city/",
    "/mountainbike/",
    "/rennrad/",
    "/gravel/",
    "/kids/",
  ];

  async fetchBikes(): Promise<Bike[]> {
    const results = await Promise.allSettled(
      this.searchUrls.map(async (path) => {
        const html = await this.fetchPage(`${this.baseUrl}${path}`);
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
        console.error(`[Radon] Error fetching ${path}:`, result.reason);
        this.recordError(result.reason instanceof Error ? result.reason.message : String(result.reason));
      }
    }
    return this.stampAndRecord(allBikes);
  }

  protected parseListing(html: string, categoryPath: string): Bike[] {
    const $ = cheerio.load(html);
    const bikes: Bike[] = [];

    // JSON-LD first
    const jsonLdBikes = this.parseJsonLdProducts($, categoryPath, "Radon");
    if (jsonLdBikes.length > 0) return jsonLdBikes;

    // Fallback: Radon product card selectors (custom React storefront)
    const cards = $(
      ".product-item, .bike-teaser, [data-product], " +
      "[class*='ProductCard'], [class*='product-card'], [class*='bikeCard']"
    );

    cards.each((_, el) => {
      try {
        const $el = $(el);

        const name =
          $el.find(".product-item__title, .bike-teaser__title, h2, h3").first().text().trim();
        if (!name) return;

        const priceText =
          $el.find(".price, .product-price, [class*='price']").first().text().trim();
        const price = this.parsePrice(priceText);
        if (!price) return;

        const listPriceText =
          $el.find("del, s, .price--old, [class*='original']").first().text().trim();
        const listPrice = listPriceText ? (this.parsePrice(listPriceText) ?? undefined) : undefined;

        const href = $el.find("a[href]").first().attr("href") || "";
        const dealerUrl = href.startsWith("http") ? href : `${this.baseUrl}${href}`;
        if (!href) return;

        const imageUrl =
          $el.find("img").first().attr("data-src") ||
          $el.find("img").first().attr("src") ||
          undefined;

        const sourceId = $el.attr("data-product") || $el.attr("data-sku") || undefined;
        const category = this.mapCategory(categoryPath.replace(/\//g, " "));

        const result = BikeSchema.safeParse({
          name,
          brand: "Radon",
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
