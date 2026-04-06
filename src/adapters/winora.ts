import * as cheerio from "cheerio";
import type { Bike } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

/**
 * Winora adapter (winora.de).
 * Winora is a major German e-bike brand (Schweinfurt, part of Winora Group
 * alongside Haibike and Ghost) and a confirmed JobRad partner. Their storefront
 * uses a custom React/Next.js app with SSR and JSON-LD product schema.
 * All Winora models sold directly are e-bikes or hybrid bikes.
 */
export class WinoraAdapter extends BaseAdapter {
  readonly name = "Winora";
  readonly cacheTtlMs = 6 * 60 * 60 * 1000;

  private baseUrl = "https://www.winora.de";
  private searchUrls = [
    "/bikes/e-bikes/",
    "/bikes/e-trekking/",
    "/bikes/e-city/",
    "/bikes/e-mountainbike/",
    "/bikes/trekking/",
    "/bikes/city/",
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
        console.error(`[Winora] Error fetching ${path}:`, result.reason);
        this.recordError(result.reason instanceof Error ? result.reason.message : String(result.reason));
      }
    }
    return this.stampAndRecord(allBikes);
  }

  protected parseListing(html: string, categoryPath: string): Bike[] {
    const $ = cheerio.load(html);
    const bikes: Bike[] = [];

    const jsonLdBikes = this.parseJsonLdProducts($, categoryPath, "Winora");
    if (jsonLdBikes.length > 0) return jsonLdBikes;

    // Fallback: Winora product card selectors
    const cards = $(
      ".product-item, .bike-card, [data-product-id], " +
      "[class*='ProductCard'], [class*='BikeCard']"
    );

    cards.each((_, el) => {
      try {
        const $el = $(el);
        const name = $el.find("h2, h3, [class*='title'], [class*='name']").first().text().trim();
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

        const category = this.mapCategory(categoryPath.replace(/\//g, " "));
        const result = BikeSchema.safeParse({
          name,
          brand: "Winora",
          category,
          price: listPrice && price < listPrice ? price : price,
          listPrice: listPrice && listPrice > price ? listPrice : undefined,
          offerPrice: listPrice && price < listPrice ? price : undefined,
          dealer: this.name,
          dealerUrl,
          imageUrl,
          sourceType: "scrape" as const,
          ...this.inferFromName(name),
        });
        if (result.success) bikes.push(result.data);
      } catch { /* skip malformed entries */ }
    });

    return bikes;
  }
}
