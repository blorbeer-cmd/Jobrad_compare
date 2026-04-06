import * as cheerio from "cheerio";
import type { Bike } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

/**
 * Ghost Bikes adapter (ghost-bikes.com).
 * Ghost is a German mountain bike brand (Waldsassen) and confirmed JobRad
 * partner. Their storefront is a custom React app with JSON-LD product schema.
 */
export class GhostBikesAdapter extends BaseAdapter {
  readonly name = "Ghost Bikes";
  readonly cacheTtlMs = 6 * 60 * 60 * 1000;

  private baseUrl = "https://www.ghost-bikes.com";
  private searchUrls = [
    "/de/e-bikes/",
    "/de/e-mountainbikes/",
    "/de/e-trekking-e-city/",
    "/de/mountainbikes/",
    "/de/trekking-crossbikes/",
    "/de/kids/",
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
        console.error(`[Ghost Bikes] Error fetching ${path}:`, result.reason);
        this.recordError(result.reason instanceof Error ? result.reason.message : String(result.reason));
      }
    }
    return this.stampAndRecord(allBikes);
  }

  protected parseListing(html: string, categoryPath: string): Bike[] {
    const $ = cheerio.load(html);
    const bikes: Bike[] = [];

    const jsonLdBikes = this.parseJsonLdProducts($, categoryPath, "Ghost");
    if (jsonLdBikes.length > 0) return jsonLdBikes;

    // Fallback: Ghost product card selectors
    const cards = $(
      ".product-item, .bike-card, [data-product-id], " +
      "article.product-box, [class*='ProductCard']"
    );

    cards.each((_, el) => {
      try {
        const $el = $(el);
        const name =
          $el.find(".product-name a, h2 a, h3 a, [class*='title'] a").first().text().trim();
        if (!name) return;

        const priceText = $el.find(".price, [class*='price']").first().text().trim();
        const price = this.parsePrice(priceText);
        if (!price) return;

        const listPriceText = $el.find("del, s, [class*='old']").first().text().trim();
        const listPrice = listPriceText ? (this.parsePrice(listPriceText) ?? undefined) : undefined;

        const href = $el.find("a[href]").first().attr("href") || "";
        const dealerUrl = href.startsWith("http") ? href : `${this.baseUrl}${href}`;
        if (!href) return;

        const imageUrl =
          $el.find("img").first().attr("data-src") ||
          $el.find("img").first().attr("src") || undefined;

        const sourceId = $el.attr("data-product-id") || undefined;
        const category = this.mapCategory(categoryPath.replace(/\//g, " "));

        const result = BikeSchema.safeParse({
          name,
          brand: "Ghost",
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
