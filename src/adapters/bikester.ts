import * as cheerio from "cheerio";
import type { Bike } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

/**
 * Bikester adapter (bikester.de).
 * Bikester (Internetstores group) serves SSR product listings with React hydration.
 * The initial HTML contains product data, making Cheerio scraping viable.
 */
export class BikesterAdapter extends BaseAdapter {
  readonly name = "Bikester";
  readonly cacheTtlMs = 6 * 60 * 60 * 1000; // 6 hours

  private baseUrl = "https://www.bikester.de";
  private searchUrls = [
    "/fahrraeder/e-bikes/",
    "/fahrraeder/trekking-bikes/",
    "/fahrraeder/city-bikes/",
    "/fahrraeder/mountainbikes/",
    "/fahrraeder/rennraeder/",
    "/fahrraeder/gravel-bikes/",
    "/fahrraeder/kinderfahrraeder/",
    "/fahrraeder/cargo-bikes/",
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
        console.error(`[Bikester] Error fetching ${path}:`, result.reason);
        this.recordError(result.reason instanceof Error ? result.reason.message : String(result.reason));
      }
    }
    return this.stampAndRecord(allBikes);
  }

  protected parseListing(html: string, categoryPath: string): Bike[] {
    const $ = cheerio.load(html);
    const bikes: Bike[] = [];

    // Internetstores / Bikester product grid
    const cards = $(
      ".product-item, .product-cell, li[data-product], " +
      "[class*='ProductItem'], [data-testid='product-item'], .product-card"
    );
    const seenIds = new Set<string>();

    cards.each((_, el) => {
      try {
        const $el = $(el);

        const sourceId =
          $el.attr("data-product") ||
          $el.attr("data-product-id") ||
          $el.attr("data-sku") ||
          undefined;
        if (sourceId && seenIds.has(sourceId)) return;
        if (sourceId) seenIds.add(sourceId);

        // Name
        const name =
          $el.find(".product-item__name a, .product-name a").first().text().trim() ||
          $el.find("h2 a, h3 a").first().text().trim() ||
          $el.find(".product-item__name, .product-name").first().text().trim();
        if (!name) return;

        // Current price — Internetstores shows offer price prominently
        const priceText =
          $el.find(".product-item__price, .price-current, .offer-price").first().text().trim() ||
          $el.find(".price").first().text().trim();
        const price = this.parsePrice(priceText);
        if (!price) return;

        // Old / list price
        const listPriceText =
          $el.find(".was-price, .price-old, del, s").first().text().trim();
        const listPrice = listPriceText ? (this.parsePrice(listPriceText) ?? undefined) : undefined;

        // URL
        const href =
          $el.find("a.product-item__link, a[href*='/fahrrad'], a[href]").first().attr("href") || "";
        const dealerUrl = href.startsWith("http") ? href : `${this.baseUrl}${href}`;
        if (!href) return;

        // Image
        const imageUrl =
          $el.find("img").first().attr("data-src") ||
          $el.find("img").first().attr("data-lazy-src") ||
          $el.find("img").first().attr("src") ||
          undefined;

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
