import * as cheerio from "cheerio";
import type { Bike } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

/**
 * Specialized adapter (specialized.com).
 * Specialized sells direct via their own online store and is a JobRad partner.
 * Their storefront is a custom React/Next.js app with SSR and JSON-LD schema.
 */
export class SpecializedAdapter extends BaseAdapter {
  readonly name = "Specialized";
  readonly cacheTtlMs = 6 * 60 * 60 * 1000;

  private baseUrl = "https://www.specialized.com";
  private searchUrls = [
    "/de/de/electric",
    "/de/de/mountain",
    "/de/de/road",
    "/de/de/fitness-urban",
    "/de/de/kids",
  ];

  async fetchBikes(): Promise<Bike[]> {
    const results = await Promise.allSettled(
      this.searchUrls.map(async (path) => {
        const html = await this.fetchPage(`${this.baseUrl}${path}?filter=jobrad`);
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
        console.error(`[Specialized] Error fetching ${path}:`, result.reason);
        this.recordError(result.reason instanceof Error ? result.reason.message : String(result.reason));
      }
    }
    return this.stampAndRecord(allBikes);
  }

  protected parseListing(html: string, categoryPath: string): Bike[] {
    const $ = cheerio.load(html);
    const bikes: Bike[] = [];

    // JSON-LD first — Specialized embeds rich product schema
    const jsonLdBikes = this.parseJsonLdProducts($, categoryPath, "Specialized");
    if (jsonLdBikes.length > 0) return jsonLdBikes;

    // Fallback: product card selectors
    const cards = $(
      ".product-card, [data-testid='product-card'], " +
      "[class*='ProductCard'], [class*='product-card']"
    );

    cards.each((_, el) => {
      try {
        const $el = $(el);

        const name =
          $el.find(".product-card__name, .product-title, h3, h2").first().text().trim();
        if (!name) return;

        const priceText =
          $el.find(".product-card__price, .price, [class*='price']").first().text().trim();
        const price = this.parsePrice(priceText);
        if (!price) return;

        const listPriceText =
          $el.find("del, s, [class*='original-price'], [class*='was-price']").first().text().trim();
        const listPrice = listPriceText ? (this.parsePrice(listPriceText) ?? undefined) : undefined;

        const href = $el.find("a[href]").first().attr("href") || "";
        const dealerUrl = href.startsWith("http") ? href : `${this.baseUrl}${href}`;
        if (!href) return;

        const imageUrl =
          $el.find("img").first().attr("data-src") ||
          $el.find("img").first().attr("src") ||
          undefined;

        const sourceId = $el.attr("data-product-id") || $el.attr("data-sku") || undefined;
        const category = this.mapCategory(categoryPath.replace(/\//g, " "));

        const result = BikeSchema.safeParse({
          name,
          brand: "Specialized",
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
