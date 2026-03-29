import * as cheerio from "cheerio";
import type { Bike } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

export class FahrradXXLAdapter extends BaseAdapter {
  readonly name = "Fahrrad XXL";
  readonly cacheTtlMs = 6 * 60 * 60 * 1000; // 6 hours

  private baseUrl = "https://www.fahrrad-xxl.de";
  private searchUrls = [
    "/fahrraeder/e-bike/",
    "/fahrraeder/trekkingraeder/",
    "/fahrraeder/citybike/",
    "/fahrraeder/mountainbikes/",
    "/fahrraeder/rennraeder/",
    "/fahrraeder/rennraeder/gravel-bikes/",
  ];

  async fetchBikes(): Promise<Bike[]> {
    const allBikes: Bike[] = [];
    for (const path of this.searchUrls) {
      try {
        const html = await this.fetchPage(`${this.baseUrl}${path}?jobrad=1`);
        allBikes.push(...this.parseListing(html, path));
      } catch (error) {
        console.error(`[FahrradXXL] Error fetching ${path}:`, error);
        this.recordError(error instanceof Error ? error.message : String(error));
      }
    }
    return this.stampAndRecord(allBikes);
  }

  protected parseListing(html: string, categoryPath: string): Bike[] {
    const $ = cheerio.load(html);
    const bikes: Bike[] = [];
    const cards = $("[data-product-id]");
    console.log(`[FahrradXXL] ${categoryPath}: ${cards.length} product cards found`);
    cards.each((_, el) => {
      try {
        const $el = $(el);

        // Brand and title are in separate elements
        const brand = $el.find(".fxxl-element-artikel__brand").first().text().trim();
        const title = $el.find(".fxxl-element-artikel__title").first().text().trim();
        // Fallback: use img alt attribute which contains the full product name
        const imgAlt = $el.find("img").first().attr("alt")?.trim() || "";
        const name = brand && title ? `${brand} ${title}` : imgAlt || title || brand;
        if (!name) return;

        // Crossed-out / old price (must be checked BEFORE current price)
        const listPriceText = $el.find(".fxxl-element-artikel__price--old, .fxxl-element-artikel__price--uvp, del").first().text().trim();

        // Current price — exclude old/uvp price elements
        const priceEl = $el.find(".fxxl-element-artikel__price, .fxxl-element-artikel__price--current").not(".fxxl-element-artikel__price--old, .fxxl-element-artikel__price--uvp").first();
        const priceText = priceEl.text().trim();
        const price = this.parsePrice(priceText);
        if (!price) return;
        const listPrice = listPriceText ? this.parsePrice(listPriceText) ?? undefined : undefined;

        // The card itself is an <a> tag with href
        const href = $el.attr("href") || $el.find("a[href]").first().attr("href") || "";
        const dealerUrl = href.startsWith("http") ? href : `${this.baseUrl}${href}`;

        // Image with srcset or src
        const imageUrl = $el.find("img.fxxl-element-artikel__image").first().attr("src")
          || $el.find("img").first().attr("src");

        const category = this.mapCategory(categoryPath);
        const sourceId = $el.attr("data-product-id") || undefined;

        const result = BikeSchema.safeParse({
          name,
          brand: brand || this.extractBrand(name),
          category,
          price: listPrice && price < listPrice ? price : price,
          listPrice: listPrice && listPrice > price ? listPrice : undefined,
          offerPrice: listPrice && price < listPrice ? price : undefined,
          dealer: this.name,
          dealerUrl,
          imageUrl: imageUrl || undefined,
          sourceId,
          sourceType: "scrape" as const,
        });
        if (result.success) bikes.push(result.data);
      } catch { /* skip malformed entries */ }
    });
    return bikes;
  }
}
