import * as cheerio from "cheerio";
import type { Bike } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

/**
 * Canyon adapter (canyon.com).
 * Canyon sells direct-to-consumer online. Their storefront uses server-side
 * rendering (Next.js/Angular Universal) so product listings appear in the
 * initial HTML. Canyon is a confirmed JobRad partner.
 *
 * Canyon URL pattern: /de-de/{category}/?filter[...]=jobrad
 * Product data is embedded as JSON-LD and also in data attributes.
 */
export class CanyonAdapter extends BaseAdapter {
  readonly name = "Canyon";
  readonly cacheTtlMs = 6 * 60 * 60 * 1000;

  private baseUrl = "https://www.canyon.com";
  private searchUrls = [
    "/de-de/e-bikes/",
    "/de-de/trekking-bikes/",
    "/de-de/city-bikes/",
    "/de-de/mountain-bikes/",
    "/de-de/road-bikes/",
    "/de-de/gravel-bikes/",
    "/de-de/kids-bikes/",
    "/de-de/cargo-bikes/",
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
        console.error(`[Canyon] Error fetching ${path}:`, result.reason);
        this.recordError(result.reason instanceof Error ? result.reason.message : String(result.reason));
      }
    }
    return this.stampAndRecord(allBikes);
  }

  protected parseListing(html: string, categoryPath: string): Bike[] {
    const $ = cheerio.load(html);
    const bikes: Bike[] = [];

    // Try JSON-LD structured data first (most reliable for SSR shops)
    const jsonLdBikes = this.parseJsonLdProducts($, categoryPath, "Canyon");
    if (jsonLdBikes.length > 0) return jsonLdBikes;

    // Fallback: Canyon product tile selectors
    const cards = $(
      "[data-testid='productTile'], .productTile, .product-tile, " +
      ".ProductCard, [class*='ProductCard'], [class*='productCard']"
    );

    cards.each((_, el) => {
      try {
        const $el = $(el);

        const name =
          $el.find("[data-testid='productTileName'], .productTile__title, .product-name").first().text().trim() ||
          $el.find("h2, h3").first().text().trim();
        if (!name) return;

        const priceText =
          $el.find("[data-testid='productTilePrice'], .productTile__price, .price").first().text().trim();
        const price = this.parsePrice(priceText);
        if (!price) return;

        const listPriceText =
          $el.find(".productTile__price--rrp, del, s, .price--old").first().text().trim();
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
          brand: "Canyon",
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
