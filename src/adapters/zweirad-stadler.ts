import * as cheerio from "cheerio";
import type { Bike } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

/**
 * Zweirad Stadler adapter (zweirad-stadler.de).
 * Zweirad Stadler is one of Germany's largest bike retail chains with stores
 * across southern Germany and a growing online shop. Confirmed JobRad partner.
 *
 * Their shop uses a Shopware-based platform (similar product card structure
 * to other Shopware 6 shops). Product listings are server-rendered.
 *
 * Typical Shopware 6 selectors:
 *   Cards:     article.product-box  /  .product-box
 *   Name:      .product-name a  /  .product-box__title a
 *   Price:     .product-box__price .price--current  /  .price--default
 *   Old price: .price--line-through  /  del
 *   Image:     img.product-image  /  .product-box__image img
 *   URL:       a.product-name[href]  /  a[href^="/detail/"]
 */
export class ZweiradStadlerAdapter extends BaseAdapter {
  readonly name = "Zweirad Stadler";
  readonly cacheTtlMs = 6 * 60 * 60 * 1000; // 6 hours

  private baseUrl = "https://www.zweirad-stadler.de";
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
        console.error(`[Zweirad Stadler] Error fetching ${path}:`, result.reason);
        this.recordError(result.reason instanceof Error ? result.reason.message : String(result.reason));
      }
    }
    return this.stampAndRecord(allBikes);
  }

  protected parseListing(html: string, categoryPath: string): Bike[] {
    const $ = cheerio.load(html);

    // Try JSON-LD first — Shopware 6 shops often include product schema
    const jsonLdBikes = this.parseJsonLdProducts($, categoryPath);
    if (jsonLdBikes.length > 0) return jsonLdBikes;

    const bikes: Bike[] = [];

    // Fallback: Shopware 6 product card selectors
    const cards = $(
      "article.product-box, .product-box, " +
      "[data-product-id], .product-card, li.product-item"
    );
    const seenIds = new Set<string>();

    cards.each((_, el) => {
      try {
        const $el = $(el);

        const sourceId =
          $el.attr("data-product-id") ||
          $el.attr("data-id") ||
          undefined;
        if (sourceId && seenIds.has(sourceId)) return;
        if (sourceId) seenIds.add(sourceId);

        // Shopware 6 Storefront: <a class="product-name"> IS the anchor
        const name =
          $el.find("a.product-name").first().text().trim() ||
          $el.find(".product-name a, .product-box__title a, .product-info--name a").first().text().trim() ||
          $el.find("h2 a, h3 a").first().text().trim() ||
          $el.find(".product-name, .product-title").first().text().trim();
        if (!name) return;

        // Shopware 6 Storefront price selectors
        const priceText =
          $el.find(".price--current, .price--default, .price-unit-value").first().text().trim() ||
          $el.find(".product-price .price, .price").first().text().trim();
        const price = this.parsePrice(priceText);
        if (!price) return;

        // Old / list price
        const listPriceText =
          $el.find(".price--line-through, .price--strike, del, s").first().text().trim();
        const listPrice = listPriceText ? (this.parsePrice(listPriceText) ?? undefined) : undefined;

        // URL
        const href =
          $el.find("a[href*='/detail/'], a.product-name, a[href]").first().attr("href") || "";
        const dealerUrl = href.startsWith("http") ? href : `${this.baseUrl}${href}`;
        if (!href) return;

        // Image
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
