import * as cheerio from "cheerio";
import type { Bike } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

export class Bike24Adapter extends BaseAdapter {
  readonly name = "Bike24";
  readonly cacheTtlMs = 6 * 60 * 60 * 1000; // 6 hours

  private baseUrl = "https://www.bike24.de";
  private searchUrls = [
    "/fahrraeder/e-bikes/",
    "/fahrraeder/trekking-bikes/",
    "/fahrraeder/city-bikes/",
    "/fahrraeder/mountainbikes/",
    "/fahrraeder/rennraeder/",
    "/fahrraeder/gravel-bikes/",
  ];

  async fetchBikes(): Promise<Bike[]> {
    const allBikes: Bike[] = [];
    for (const path of this.searchUrls) {
      try {
        const html = await this.fetchPage(`${this.baseUrl}${path}?jobrad=1`);
        allBikes.push(...this.parseListing(html, path));
      } catch (error) {
        console.error(`[Bike24] Error fetching ${path}:`, error);
        this.recordError(error instanceof Error ? error.message : String(error));
      }
    }
    return this.stampAndRecord(allBikes);
  }

  protected parseListing(html: string, categoryPath: string): Bike[] {
    const $ = cheerio.load(html);
    const bikes: Bike[] = [];

    // Bike24 uses React with data attributes
    $(".product-card, .product-listing-item, [data-product-id], [data-testid='product-card']").each((_, el) => {
      try {
        const $el = $(el);

        const name =
          $el.find(".product-card__name, .product-name, [data-testid='product-name']").first().text().trim() ||
          $el.find("h3 a, h2 a, a[class*='name']").first().text().trim();
        if (!name) return;

        const priceText =
          $el.find(".product-card__price, .price-box__price, [data-testid='product-price']").first().text().trim();
        const price = this.parsePrice(priceText);
        if (!price) return;

        const listPriceText =
          $el.find(".price-box__old-price, .price--old, del, s").first().text().trim();
        const listPrice = listPriceText ? (this.parsePrice(listPriceText) ?? undefined) : undefined;

        const href =
          $el.find("a[href]").first().attr("href") || "";
        const dealerUrl = href.startsWith("http") ? href : `${this.baseUrl}${href}`;

        const imageUrl =
          $el.find("img").first().attr("data-src") ||
          $el.find("img").first().attr("data-lazy-src") ||
          $el.find("img").first().attr("src") ||
          undefined;

        const category = this.mapCategory(categoryPath.replace(/\//g, " ").replace("fahrraeder", ""));
        const availability =
          $el.find(".availability-label, .delivery-time, .stock-info").first().text().trim() || undefined;
        const sourceId = $el.attr("data-product-id") || $el.attr("data-sku") || undefined;

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
        });
        if (result.success) bikes.push(result.data);
      } catch {
        /* skip malformed entries */
      }
    });

    return bikes;
  }
}
