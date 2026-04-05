import * as cheerio from "cheerio";
import type { Bike } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

/**
 * Decathlon adapter (decathlon.de).
 * Decathlon joined JobRad as a partner in April 2024. With 80+ stores in
 * Germany and a large online shop, they are a significant addition.
 *
 * Decathlon's platform uses Next.js with SSR — product listings are in the
 * initial HTML. They also embed JSON-LD Product schema which we parse first.
 * Bike categories use Decathlon's sport code system (e.g. c0-fahrraeder).
 */
export class DecathlonAdapter extends BaseAdapter {
  readonly name = "Decathlon";
  readonly cacheTtlMs = 6 * 60 * 60 * 1000;

  private baseUrl = "https://www.decathlon.de";
  private searchUrls = [
    "/browse/c0-fahrraeder/_/N-1nfp7h6",       // E-Bikes
    "/browse/c0-fahrraeder/_/N-1nfp7gd",       // Trekkingräder
    "/browse/c0-fahrraeder/_/N-1nfp7gk",       // Cityräder
    "/browse/c0-fahrraeder/_/N-1nfp7go",       // Mountainbikes
    "/browse/c0-fahrraeder/_/N-1nfp7gp",       // Rennräder
    "/browse/c0-fahrraeder/_/N-1nfp7fz",       // Gravelbikes
    "/browse/c0-fahrraeder/_/N-1nfp7h3",       // Kinderfahrräder
    "/browse/c0-fahrraeder/_/N-1nfp7gh",       // Lastenräder
  ];

  async fetchBikes(): Promise<Bike[]> {
    const results = await Promise.allSettled(
      this.searchUrls.map(async (path) => {
        // Decathlon uses Nq= parameter for JobRad filtering
        const html = await this.fetchPage(`${this.baseUrl}${path}+Nq=JobRad`);
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
        console.error(`[Decathlon] Error fetching ${path}:`, result.reason);
        this.recordError(result.reason instanceof Error ? result.reason.message : String(result.reason));
      }
    }
    return this.stampAndRecord(allBikes);
  }

  protected parseListing(html: string, categoryPath: string): Bike[] {
    const $ = cheerio.load(html);
    const bikes: Bike[] = [];

    // Try JSON-LD first
    const jsonLdBikes = this.parseJsonLd($, categoryPath);
    if (jsonLdBikes.length > 0) return jsonLdBikes;

    // Fallback: Decathlon React product card selectors
    const cards = $(
      "[data-testid='product'], .product-card, .vtmn-card, " +
      "[class*='ProductCard'], [class*='product-card']"
    );

    cards.each((_, el) => {
      try {
        const $el = $(el);

        const name =
          $el.find("[data-testid='product-title'], .product-card__title, .vtmn-card__title").first().text().trim() ||
          $el.find("h2, h3, p[class*='title']").first().text().trim();
        if (!name) return;

        const priceText =
          $el.find("[data-testid='product-price'], .product-prices__price, .vtmn-price").first().text().trim();
        const price = this.parsePrice(priceText);
        if (!price) return;

        const listPriceText =
          $el.find(".product-prices__crossed-out-price, .vtmn-price--strikethrough, del, s").first().text().trim();
        const listPrice = listPriceText ? (this.parsePrice(listPriceText) ?? undefined) : undefined;

        const href = $el.find("a[href]").first().attr("href") || "";
        const dealerUrl = href.startsWith("http") ? href : `${this.baseUrl}${href}`;
        if (!href) return;

        const imageUrl =
          $el.find("img").first().attr("data-src") ||
          $el.find("img").first().attr("src") ||
          undefined;

        const sourceId =
          $el.attr("data-product-id") || $el.attr("data-model-id") || undefined;
        const category = this.mapCategory(categoryPath);

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

  private parseJsonLd($: cheerio.CheerioAPI, categoryPath: string): Bike[] {
    const bikes: Bike[] = [];

    $("script[type='application/ld+json']").each((_, el) => {
      try {
        const json = JSON.parse($(el).html() ?? "");
        const items: unknown[] =
          json["@type"] === "ItemList"
            ? (json.itemListElement ?? []).map((e: { item?: unknown }) => e.item)
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
          const sku = (p.sku as string) || undefined;
          const category = this.mapCategory(categoryPath);

          const result = BikeSchema.safeParse({
            name,
            brand: this.extractBrand(name),
            category,
            price,
            dealer: this.name,
            dealerUrl,
            imageUrl: imageUrl || undefined,
            sourceId: sku,
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
