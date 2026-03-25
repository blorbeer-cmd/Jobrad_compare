import * as cheerio from "cheerio";
import type { Bike } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

export class FahrradXXLAdapter extends BaseAdapter {
  name = "Fahrrad XXL";
  private baseUrl = "https://www.fahrrad-xxl.de";
  private searchUrls = ["/fahrraeder/e-bikes","/fahrraeder/trekkingbikes","/fahrraeder/citybikes","/fahrraeder/mountainbikes","/fahrraeder/rennraeder","/fahrraeder/gravelbikes"];

  async fetchBikes(): Promise<Bike[]> {
    const allBikes: Bike[] = [];
    for (const path of this.searchUrls) {
      try {
        const html = await this.fetchPage(`${this.baseUrl}${path}?jobrad=1`);
        allBikes.push(...this.parseListing(html, path));
      } catch (error) { console.error(`[FahrradXXL] Error fetching ${path}:`, error); }
    }
    return allBikes;
  }

  private parseListing(html: string, categoryPath: string): Bike[] {
    const $ = cheerio.load(html);
    const bikes: Bike[] = [];
    $(".product-card, .product-item, [data-product-id]").each((_, el) => {
      try {
        const $el = $(el);
        const name = $el.find(".product-title, .product-name, h3 a, h2 a").first().text().trim() || $el.find("a[title]").first().attr("title")?.trim();
        if (!name) return;
        const price = this.parsePrice($el.find(".price, .product-price, .current-price").first().text().trim());
        if (!price) return;
        const href = $el.find("a[href]").first().attr("href") || "";
        const dealerUrl = href.startsWith("http") ? href : `${this.baseUrl}${href}`;
        const imageUrl = $el.find("img").first().attr("data-src") || $el.find("img").first().attr("src") || undefined;
        const category = this.mapCategory(categoryPath.replace("/fahrraeder/", ""));
        const availability = $el.find(".availability, .delivery-info, .stock-info").first().text().trim() || undefined;
        const result = BikeSchema.safeParse({ name, brand: this.extractBrand(name), category, price, dealer: this.name, dealerUrl, imageUrl: imageUrl || undefined, availability });
        if (result.success) bikes.push(result.data);
      } catch { /* skip */ }
    });
    return bikes;
  }
}
