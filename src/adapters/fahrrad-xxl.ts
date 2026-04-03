import * as cheerio from "cheerio";
import type { Bike } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

export class FahrradXXLAdapter extends BaseAdapter {
  readonly name = "Fahrrad XXL";
  readonly cacheTtlMs = 6 * 60 * 60 * 1000; // 6 hours

  private baseUrl = "https://www.fahrrad-xxl.de";
  private searchUrls = [
    "/fahrraeder/e-bikes",
    "/fahrraeder/trekkingbikes",
    "/fahrraeder/citybikes",
    "/fahrraeder/mountainbikes",
    "/fahrraeder/rennraeder",
    "/fahrraeder/gravelbikes",
  ];

  async fetchBikes(): Promise<Bike[]> {
    // Fetch all categories in parallel to stay within Vercel function timeout
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
        console.error(`[FahrradXXL] Error fetching ${path}:`, result.reason);
        this.recordError(result.reason instanceof Error ? result.reason.message : String(result.reason));
      }
    }
    return this.stampAndRecord(allBikes);
  }

  protected parseListing(html: string, categoryPath: string): Bike[] {
    const $ = cheerio.load(html);
    const bikes: Bike[] = [];

    // Real fahrrad-xxl.de structure: product links with data-product-id
    $("a.fxxl-element-artikel__link[data-product-id]").each((_, el) => {
      try {
        const $el = $(el);

        // Brand + title are separate elements; combine into full name
        const brand = $el.find(".fxxl-element-artikel__brand").first().text().trim();
        const title = $el.find(".fxxl-element-artikel__title").first().text().trim();
        const imgAlt = $el.find("img.fxxl-element-artikel__image").first().attr("alt")?.trim();
        const name = brand && title ? `${brand} ${title}` : imgAlt || title || brand;
        if (!name) return;

        // Current price: prefer --new (sale price), fall back to plain price (non-sale)
        let priceEl = $el.find(".fxxl-element-artikel__price--new").first();
        if (!priceEl.length) {
          priceEl = $el
            .find("[class~='fxxl-element-artikel__price']")
            .not(".fxxl-element-artikel__price--old, .fxxl-element-artikel__price--discount")
            .first();
        }
        const priceText = priceEl.text().trim();

        // Crossed-out / old price (actual number is inside .fxxl-strike-price)
        const listPriceText =
          $el.find(".fxxl-element-artikel__price--old .fxxl-strike-price").first().text().trim() ||
          $el.find(".fxxl-element-artikel__price--old").first().text().trim();

        const price = this.parsePrice(priceText);
        if (!price) return;
        const listPrice = listPriceText ? (this.parsePrice(listPriceText) ?? undefined) : undefined;

        const href = $el.attr("href") || "";
        const dealerUrl = href.startsWith("http") ? href : `${this.baseUrl}${href}`;
        const imageUrl =
          $el.find("img").first().attr("data-src") ||
          $el.find("img").first().attr("src") ||
          undefined;
        const category = this.mapCategory(categoryPath.replace("/fahrraeder/", ""));
        const sourceId = $el.attr("data-product-id") || undefined;

        const result = BikeSchema.safeParse({
          name,
          brand: brand || this.extractBrand(name),
          category,
          price,
          listPrice: listPrice && listPrice > price ? listPrice : undefined,
          offerPrice: listPrice && price < listPrice ? price : undefined,
          dealer: this.name,
          dealerUrl,
          imageUrl,
          sourceId,
          sourceType: "scrape" as const,
        });
        if (result.success) bikes.push(result.data);
      } catch { /* skip malformed entries */ }
    });
    return bikes;
  }
}
