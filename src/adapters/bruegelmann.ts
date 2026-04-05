import * as cheerio from "cheerio";
import type { Bike } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

/**
 * fahrrad.de adapter (fahrrad.de).
 *
 * NOTE: bruegelmann.de has redirected to fahrrad.de since May 2024 following
 * the Internetstores insolvency. The brand is now operated by
 * fahrrad.de Bikester GmbH, Stuttgart. This adapter was updated accordingly.
 *
 * fahrrad.de and bikester.de are the same legal entity but run as separate
 * storefronts — both adapters are kept to maximise product coverage.
 */
export class FahrradDeAdapter extends BaseAdapter {
  readonly name = "fahrrad.de";
  readonly cacheTtlMs = 6 * 60 * 60 * 1000; // 6 hours

  private baseUrl = "https://www.fahrrad.de";
  private searchUrls = [
    "/fahrraeder/e-bikes/",
    "/fahrraeder/trekkingbikes/",
    "/fahrraeder/citybikes/",
    "/fahrraeder/mountainbikes/",
    "/fahrraeder/rennraeder/",
    "/fahrraeder/gravelbikes/",
    "/fahrraeder/kinderfahrraeder/",
    "/fahrraeder/lastenraeder/",
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
        console.error(`[fahrrad.de] Error fetching ${path}:`, result.reason);
        this.recordError(result.reason instanceof Error ? result.reason.message : String(result.reason));
      }
    }
    return this.stampAndRecord(allBikes);
  }

  protected parseListing(html: string, categoryPath: string): Bike[] {
    const $ = cheerio.load(html);
    const bikes: Bike[] = [];

    const cards = $(
      "article.product-item, li.product-item, .product-card, " +
      "[data-product-id], [data-testid='product-card'], .product"
    );
    const seenIds = new Set<string>();

    cards.each((_, el) => {
      try {
        const $el = $(el);

        const sourceId =
          $el.attr("data-product-id") ||
          $el.attr("data-sku") ||
          $el.attr("data-id") ||
          undefined;
        if (sourceId && seenIds.has(sourceId)) return;
        if (sourceId) seenIds.add(sourceId);

        const name =
          $el.find(".product-item__title a, .product-title a, .product-name a").first().text().trim() ||
          $el.find("h2 a, h3 a, h4 a").first().text().trim() ||
          $el.find(".product-item__title, .product-title, .product-name").first().text().trim();
        if (!name) return;

        const priceText =
          $el.find(".product-item__price-current, .price-current, .offer-price, .special-price .price").first().text().trim() ||
          $el.find(".product-item__price, .product-price").first().text().trim();
        const price = this.parsePrice(priceText);
        if (!price) return;

        const listPriceText =
          $el.find(".product-item__price-old, .price-old, del, s, .old-price .price").first().text().trim();
        const listPrice = listPriceText ? (this.parsePrice(listPriceText) ?? undefined) : undefined;

        const href =
          $el.find("a.product-item__title, a.product-title, a[href]").first().attr("href") || "";
        const dealerUrl = href.startsWith("http") ? href : `${this.baseUrl}${href}`;
        if (!href) return;

        const imageUrl =
          $el.find("img").first().attr("data-src") ||
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

/** @deprecated bruegelmann.de redirects to fahrrad.de since May 2024 — use FahrradDeAdapter */
export { FahrradDeAdapter as BruegelmannAdapter };
