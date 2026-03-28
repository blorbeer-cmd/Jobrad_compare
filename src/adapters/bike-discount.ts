import * as cheerio from "cheerio";
import type { Bike } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

export class BikeDiscountAdapter extends BaseAdapter {
  readonly name = "Bike-Discount";
  readonly cacheTtlMs = 6 * 60 * 60 * 1000; // 6 hours

  private baseUrl = "https://www.bike-discount.de";
  private searchUrls = [
    "/fahrraeder/e-bikes",
    "/fahrraeder/trekkingbikes",
    "/fahrraeder/citybikes",
    "/fahrraeder/mountainbikes",
    "/fahrraeder/rennraeder",
    "/fahrraeder/gravelbikes",
  ];

  async fetchBikes(): Promise<Bike[]> {
    const allBikes: Bike[] = [];
    for (const path of this.searchUrls) {
      try {
        const html = await this.fetchPage(`${this.baseUrl}${path}`);
        allBikes.push(...this.parseListing(html, path));
      } catch (error) {
        console.error(`[BikeDiscount] Error fetching ${path}:`, error);
        this.recordError(error instanceof Error ? error.message : String(error));
      }
    }
    return this.stampAndRecord(allBikes);
  }

  protected parseListing(html: string, categoryPath: string): Bike[] {
    const $ = cheerio.load(html);
    const bikes: Bike[] = [];
    const cards = $(".product-card, .product--box, .productCard, [data-product]");
    console.log(`[BikeDiscount] ${categoryPath}: ${cards.length} product cards found`);
    cards.each((_, el) => {
      try {
        const $el = $(el);
        const name = $el.find(".product-card__title, .product-name, h3 a").first().text().trim()
          || $el.find("a[title]").first().attr("title")?.trim();
        if (!name) return;

        const priceText = $el.find(".product-card__price, .price, .product-price").first().text().trim();
        const price = this.parsePrice(priceText);
        if (!price) return;

        const listPriceText = $el.find(".price-old, del, .original-price").first().text().trim();
        const listPrice = listPriceText ? this.parsePrice(listPriceText) ?? undefined : undefined;

        const href = $el.find("a[href]").first().attr("href") || "";
        const dealerUrl = href.startsWith("http") ? href : `${this.baseUrl}${href}`;
        const imageUrl = $el.find("img").first().attr("data-src") || $el.find("img").first().attr("src");
        const category = this.mapCategory(categoryPath.replace("/fahrraeder/", ""));
        const availability = $el.find(".delivery-status, .availability").first().text().trim() || undefined;
        const sourceId = $el.attr("data-product") || undefined;

        const result = BikeSchema.safeParse({
          name,
          brand: this.extractBrand(name),
          category,
          price,
          listPrice: listPrice && listPrice > price ? listPrice : undefined,
          offerPrice: listPrice && price < listPrice ? price : undefined,
          dealer: this.name,
          dealerUrl,
          imageUrl: imageUrl || undefined,
          availability,
          sourceId,
          sourceType: "scrape" as const,
        });
        if (result.success) bikes.push(result.data);
      } catch { /* skip malformed entries */ }
    });
    return bikes;
  }
}
