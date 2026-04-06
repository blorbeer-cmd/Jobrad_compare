import * as cheerio from "cheerio";
import type { Bike } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

/**
 * Sport Bittl adapter (bittl.com).
 * Sport Bittl is a large German sports retailer with an extensive bike department
 * and confirmed JobRad partner. Their online shop runs on Magento 2, which
 * serves product listings as server-rendered HTML.
 *
 * Magento 2 product grid selectors:
 *   Cards:     .products-grid .product-item  /  ol.products li.product-item
 *   Name:      .product-item-details .product-item-link
 *   Price:     .price-box .price  (special price for discounts)
 *   Old price: .price-box .old-price .price
 *   Image:     .product-image-photo
 *   URL:       .product-item-photo[href]  /  .product-item-link[href]
 */
export class SportBittlAdapter extends BaseAdapter {
  readonly name = "Sport Bittl";
  readonly cacheTtlMs = 6 * 60 * 60 * 1000; // 6 hours

  private baseUrl = "https://www.bittl.com";
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
        console.error(`[Sport Bittl] Error fetching ${path}:`, result.reason);
        this.recordError(result.reason instanceof Error ? result.reason.message : String(result.reason));
      }
    }
    return this.stampAndRecord(allBikes);
  }

  protected parseListing(html: string, categoryPath: string): Bike[] {
    const $ = cheerio.load(html);

    // Try JSON-LD first — Magento 2 shops often include product schema
    const jsonLdBikes = this.parseJsonLdProducts($, categoryPath);
    if (jsonLdBikes.length > 0) return jsonLdBikes;

    const bikes: Bike[] = [];

    // Fallback: Magento 2 product grid
    const cards = $("li.product-item, .product-item-info, [data-product-id]");
    const seenIds = new Set<string>();

    cards.each((_, el) => {
      try {
        const $el = $(el);

        // Magento 2 stores the product id on a form or a data attribute
        const sourceId =
          $el.find("[data-product-id]").first().attr("data-product-id") ||
          $el.attr("data-product-id") ||
          undefined;
        if (sourceId && seenIds.has(sourceId)) return;
        if (sourceId) seenIds.add(sourceId);

        // Name: Magento 2 uses <a class="product-item-link">
        const name =
          $el.find(".product-item-link, .product-name a").first().text().trim() ||
          $el.find("h2 a, h3 a").first().text().trim();
        if (!name) return;

        // Price: Magento 2 .price-box structure
        // For discounted items: .special-price .price
        // For regular items:    .price-box > .price
        const specialPriceText =
          $el.find(".special-price .price").first().text().trim();
        const regularPriceText =
          $el.find(".price-box > .price, .normal-price .price").first().text().trim();
        const priceText = specialPriceText || regularPriceText;
        const price = this.parsePrice(priceText);
        if (!price) return;

        // Old price: .old-price .price
        const listPriceText =
          $el.find(".old-price .price, .price-box .old-price").first().text().trim();
        const listPrice = listPriceText ? (this.parsePrice(listPriceText) ?? undefined) : undefined;

        // URL: .product-item-photo or .product-item-link
        const href =
          $el.find("a.product-item-photo, a.product-item-link").first().attr("href") ||
          $el.find("a[href]").first().attr("href") || "";
        const dealerUrl = href.startsWith("http") ? href : `${this.baseUrl}${href}`;
        if (!href) return;

        // Image: Magento 2 .product-image-photo
        const imageUrl =
          $el.find("img.product-image-photo, .product-image-wrapper img").first().attr("data-src") ||
          $el.find("img.product-image-photo, .product-image-wrapper img").first().attr("src") ||
          undefined;

        // Availability from stock status
        const availability =
          $el.find(".stock.available, .product-item-available").first().text().trim() ||
          $el.find(".stock.unavailable, .product-item-unavailable").first().text().trim() ||
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
          availability,
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
