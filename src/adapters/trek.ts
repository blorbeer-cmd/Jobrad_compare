import * as cheerio from "cheerio";
import type { Bike } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

/**
 * Trek adapter (trekbikes.com).
 * Trek is a major US bike brand with a large German market presence and a
 * confirmed JobRad partner. Their German storefront uses SSR with JSON-LD.
 * Category pages list all models with embedded structured data.
 */
export class TrekAdapter extends BaseAdapter {
  readonly name = "Trek";
  readonly cacheTtlMs = 6 * 60 * 60 * 1000;

  private baseUrl = "https://www.trekbikes.com";
  private searchUrls = [
    "/de-de/bikes/category/elektrisch/",
    "/de-de/bikes/category/trekking-und-stadtrad/",
    "/de-de/bikes/category/mountainbike/",
    "/de-de/bikes/category/rennrad/",
    "/de-de/bikes/category/gravelbike/",
    "/de-de/bikes/category/kinderrad/",
    "/de-de/bikes/category/lastenrad/",
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
        console.error(`[Trek] Error fetching ${path}:`, result.reason);
        this.recordError(result.reason instanceof Error ? result.reason.message : String(result.reason));
      }
    }
    return this.stampAndRecord(allBikes);
  }

  protected parseListing(html: string, categoryPath: string): Bike[] {
    const $ = cheerio.load(html);
    const bikes: Bike[] = [];

    // JSON-LD first
    const jsonLdBikes = this.parseJsonLd($, categoryPath);
    if (jsonLdBikes.length > 0) return jsonLdBikes;

    // Fallback: Trek product card selectors
    const cards = $(
      ".product-card, .bike-card, [data-testid='product-card'], " +
      "[class*='ProductCard'], [class*='product-tile']"
    );

    cards.each((_, el) => {
      try {
        const $el = $(el);

        const name =
          $el.find(".product-card__title, .bike-card__title, h2, h3").first().text().trim();
        if (!name) return;

        const priceText =
          $el.find(".product-card__price, .price, [class*='price']").first().text().trim();
        const price = this.parsePrice(priceText);
        if (!price) return;

        const listPriceText =
          $el.find("del, s, [class*='original-price'], [class*='compare-price']").first().text().trim();
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
          brand: "Trek",
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

  private parseJsonLd($: cheerio.CheerioAPI, categoryPath: string): Bike[] {
    const bikes: Bike[] = [];

    $("script[type='application/ld+json']").each((_, el) => {
      try {
        const json = JSON.parse($(el).html() ?? "");
        const items: unknown[] =
          json["@type"] === "ItemList"
            ? (json.itemListElement ?? []).map((e: { item?: unknown }) => e.item ?? e)
            : json["@type"] === "Product"
              ? [json]
              : [];

        for (const item of items) {
          if (!item || typeof item !== "object") continue;
          const p = item as Record<string, unknown>;
          if ((p["@type"] as string) !== "Product") continue;

          const name = (p.name as string)?.trim();
          if (!name) continue;

          const offer = (Array.isArray(p.offers) ? p.offers[0] : p.offers) as Record<string, unknown> | undefined;
          if (!offer) continue;

          const price = this.parsePrice(String(offer.price ?? ""));
          if (!price) continue;

          const dealerUrl = (offer.url as string) || (p.url as string) || "";
          if (!dealerUrl.startsWith("http")) continue;

          const imageUrl = Array.isArray(p.image) ? (p.image[0] as string) : (p.image as string | undefined);
          const category = this.mapCategory(categoryPath.replace(/\//g, " "));

          const result = BikeSchema.safeParse({
            name,
            brand: "Trek",
            category,
            price,
            dealer: this.name,
            dealerUrl,
            imageUrl: imageUrl || undefined,
            sourceId: (p.sku as string) || undefined,
            sourceType: "scrape" as const,
            ...this.inferFromName(name),
          });
          if (result.success) bikes.push(result.data);
        }
      } catch { /* malformed JSON-LD — skip */ }
    });

    return bikes;
  }
}
