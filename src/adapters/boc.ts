import * as cheerio from "cheerio";
import type { Bike } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

export class BOCAdapter extends BaseAdapter {
  readonly name = "B.O.C.";
  readonly cacheTtlMs = 6 * 60 * 60 * 1000; // 6 hours

  private baseUrl = "https://www.boc24.de";
  private searchUrls = [
    "/collections/e-bikes",
    "/collections/e-bikes-trekking",
    "/collections/e-bikes-city",
    "/collections/e-mountainbikes",
    "/collections/e-bikes-cross",
    "/collections/e-lastenfahrrad",
    "/collections/e-bikes-rennraeder",
    "/collections/trekkingraeder",
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
        console.error(`[B.O.C.] Error fetching ${path}:`, result.reason);
        this.recordError(result.reason instanceof Error ? result.reason.message : String(result.reason));
      }
    }
    return this.stampAndRecord(allBikes);
  }

  protected parseListing(html: string, categoryPath: string): Bike[] {
    const $ = cheerio.load(html);
    const bikes: Bike[] = [];
    const cards = $("product-card");
    const seenHandles = new Set<string>();
    console.log(`[B.O.C.] ${categoryPath}: ${cards.length} product cards found`);

    cards.each((_, el) => {
      try {
        const $el = $(el);

        // Deduplicate by handle (same product in multiple categories)
        const handle = $el.attr("handle") || "";
        if (!handle || seenHandles.has(handle)) return;
        seenHandles.add(handle);

        // Product name from title link
        const name = $el.find(".product-card__title a").first().text().trim();
        if (!name) return;

        // Current/sale price from <sale-price> custom element
        const salePriceText = $el.find("sale-price").first().text().trim();
        const price = this.parsePrice(salePriceText);
        if (!price) return;

        // Compare-at / UVP price from <compare-at-price> custom element
        const compareText = $el.find("compare-at-price").first().text().trim();
        const listPrice = compareText ? this.parsePrice(compareText) ?? undefined : undefined;

        // Product URL
        const href = $el.find(".product-card__title a").first().attr("href") || "";
        const dealerUrl = href.startsWith("http") ? href : `${this.baseUrl}${href}`;

        // Image URL (prefer src from srcset-enabled img)
        const imgSrc = $el.find(".product-card__image").first().attr("src") || "";
        const imageUrl = imgSrc.startsWith("//") ? `https:${imgSrc}` : imgSrc || undefined;

        const category = this.mapCategory(categoryPath);
        const brand = this.extractBrand(name);

        const result = BikeSchema.safeParse({
          name,
          brand,
          category,
          price: listPrice && price < listPrice ? price : price,
          listPrice: listPrice && listPrice > price ? listPrice : undefined,
          offerPrice: listPrice && price < listPrice ? price : undefined,
          dealer: this.name,
          dealerUrl,
          imageUrl: imageUrl || undefined,
          sourceId: handle,
          sourceType: "scrape" as const,
        });
        if (result.success) bikes.push(result.data);
      } catch { /* skip malformed entries */ }
    });
    return bikes;
  }
}
