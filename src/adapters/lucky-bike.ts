import * as cheerio from "cheerio";
import type { Bike } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

export class LuckyBikeAdapter extends BaseAdapter {
  name = "Lucky Bike";

  private baseUrl = "https://www.lucky-bike.de";
  private searchUrls = [
    "/e-bikes/",
    "/fahrraeder/trekkingfahrraeder/",
    "/fahrraeder/cityraeder-urbanraeder/",
    "/fahrraeder/mountainbikes/",
    "/fahrraeder/rennraeder/",
    "/fahrraeder/gravel-crossraeder/",
  ];

  async fetchBikes(): Promise<Bike[]> {
    const allBikes: Bike[] = [];
    for (const path of this.searchUrls) {
      try {
        const html = await this.fetchPage(`${this.baseUrl}${path}`);
        const bikes = this.parseListing(html, path);
        allBikes.push(...bikes);
      } catch (error) {
        console.error(`[LuckyBike] Error fetching ${path}:`, error);
      }
    }
    return allBikes;
  }

  private parseListing(html: string, categoryPath: string): Bike[] {
    const $ = cheerio.load(html);
    const bikes: Bike[] = [];
    $(".product--box, .product-box, [data-product-id]").each((_, el) => {
      try {
        const $el = $(el);
        const name = $el.find(".product--title, .product-name, .product-title a").first().text().trim()
          || $el.find("a[title]").first().attr("title")?.trim();
        if (!name) return;
        const priceText = $el.find(".product--price, .price--default, .product-price").first().text().trim();
        const price = this.parsePrice(priceText);
        if (!price) return;
        const href = $el.find(".product--title a, .product-name a, a[href]").first().attr("href") || "";
        const dealerUrl = href.startsWith("http") ? href : `${this.baseUrl}${href}`;
        const imageUrl = $el.find("img").first().attr("data-src")
          || $el.find("img").first().attr("src") || undefined;
        const category = this.mapCategory(categoryPath.replace(/\//g, " "));
        const availability = $el.find(".delivery--status-icon, .delivery-info").first().text().trim() || undefined;
        const result = BikeSchema.safeParse({
          name, brand: this.extractBrand(name), category, price,
          dealer: this.name, dealerUrl, imageUrl: imageUrl || undefined, availability,
        });
        if (result.success) bikes.push(result.data);
      } catch { /* skip */ }
    });
    return bikes;
  }
}
