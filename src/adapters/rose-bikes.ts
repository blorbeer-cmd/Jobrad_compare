import * as cheerio from "cheerio";
import type { Bike } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

export class RoseBikesAdapter extends BaseAdapter {
  readonly name = "Rose Bikes";
  readonly cacheTtlMs = 6 * 60 * 60 * 1000; // 6 hours

  private baseUrl = "https://www.rosebikes.de";
  private searchUrls = [
    "/fahrraeder/e-bike",
    "/fahrraeder/trekking",
    "/fahrraeder/city",
    "/fahrraeder/mountainbike",
    "/fahrraeder/rennrad",
    "/fahrraeder/gravel",
    "/fahrraeder/kinder",
    "/fahrraeder/cargo",
  ];

  async fetchBikes(): Promise<Bike[]> {
    const allBikes: Bike[] = [];
    for (const path of this.searchUrls) {
      try {
        const html = await this.fetchPage(`${this.baseUrl}${path}?jobrad=true`);
        allBikes.push(...this.parseListing(html, path));
      } catch (error) {
        console.error(`[RoseBikes] Error fetching ${path}:`, error);
        this.recordError(error instanceof Error ? error.message : String(error));
      }
    }
    return this.stampAndRecord(allBikes);
  }

  protected parseListing(html: string, categoryPath: string): Bike[] {
    const $ = cheerio.load(html);
    const bikes: Bike[] = [];

    // Rose Bikes uses Next.js with custom product grid
    $(".product-tile, .catalog-product-tile, [data-testid='product-tile']").each((_, el) => {
      try {
        const $el = $(el);

        const name =
          $el.find(".product-tile__title, .catalog-product-tile__title, [data-testid='product-title']").first().text().trim() ||
          $el.find("h3, h2").first().text().trim();
        if (!name) return;

        const priceText =
          $el.find(".product-tile__price, .price__current, [data-testid='product-price']").first().text().trim();
        const price = this.parsePrice(priceText);
        if (!price) return;

        const listPriceText =
          $el.find(".product-tile__price--old, .price__was, del, s").first().text().trim();
        const listPrice = listPriceText ? (this.parsePrice(listPriceText) ?? undefined) : undefined;

        const href =
          $el.find("a[href]").first().attr("href") || "";
        const dealerUrl = href.startsWith("http") ? href : `${this.baseUrl}${href}`;

        const imageUrl =
          $el.find("img").first().attr("data-src") ||
          $el.find("img").first().attr("src") ||
          undefined;

        const category = this.mapCategory(categoryPath.replace("/fahrraeder/", ""));
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
          sourceId,
          sourceType: "scrape" as const,
          ...this.inferFromName(name),
        });
        if (result.success) bikes.push(result.data);
      } catch {
        /* skip malformed entries */
      }
    });

    return bikes;
  }
}
