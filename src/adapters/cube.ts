import * as cheerio from "cheerio";
import type { Bike } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

/**
 * Cube Bikes adapter (cube.eu).
 * Cube is the largest German bicycle brand and a confirmed JobRad partner.
 * Their storefront is a custom React/Next.js app with SSR and JSON-LD schema.
 * Product data is embedded as application/ld+json ItemList on category pages.
 */
export class CubeAdapter extends BaseAdapter {
  readonly name = "Cube";
  readonly cacheTtlMs = 6 * 60 * 60 * 1000;

  private baseUrl = "https://www.cube.eu";
  private searchUrls = [
    "/de-de/bikes-list/e-bikes/",
    "/de-de/bikes-list/trekking-touring/",
    "/de-de/bikes-list/city-comfort/",
    "/de-de/bikes-list/mountain/",
    "/de-de/bikes-list/road/",
    "/de-de/bikes-list/gravel-cx/",
    "/de-de/bikes-list/kids/",
    "/de-de/bikes-list/cargo/",
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
        console.error(`[Cube] Error fetching ${path}:`, result.reason);
        this.recordError(result.reason instanceof Error ? result.reason.message : String(result.reason));
      }
    }
    return this.stampAndRecord(allBikes);
  }

  protected parseListing(html: string, categoryPath: string): Bike[] {
    const $ = cheerio.load(html);
    const bikes: Bike[] = [];

    // JSON-LD first — Cube embeds rich product schema on category pages
    const jsonLdBikes = this.parseJsonLdProducts($, categoryPath, "Cube");
    if (jsonLdBikes.length > 0) return jsonLdBikes;

    // Fallback: Cube product card selectors (Shopware 6 or custom React)
    const cards = $(
      ".product-item, article.product-box, [data-product-id], " +
      ".bike-card, [class*='ProductCard'], [class*='product-card']"
    );

    cards.each((_, el) => {
      try {
        const $el = $(el);

        const name =
          $el.find(".product-name a, .product-box__title a, h2 a, h3 a").first().text().trim();
        if (!name) return;

        const priceText =
          $el.find(".price--default, .price--current, .price").first().text().trim();
        const price = this.parsePrice(priceText);
        if (!price) return;

        const listPriceText =
          $el.find(".price--line-through, del, s").first().text().trim();
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
          brand: "Cube",
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
