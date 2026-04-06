import * as cheerio from "cheerio";
import type { Bike } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

/**
 * Riese & Müller adapter (r-m.de).
 * Riese & Müller is a premium German e-bike manufacturer (Darmstadt) and a
 * confirmed JobRad partner. Their shop runs on Adobe Commerce (Magento 2)
 * with a custom Hyvä frontend. Product data is available via JSON-LD.
 * All bikes are electric — R&M does not sell non-electric bikes.
 */
export class RieseMuellerAdapter extends BaseAdapter {
  readonly name = "Riese & Müller";
  readonly cacheTtlMs = 6 * 60 * 60 * 1000;

  private baseUrl = "https://www.r-m.de";
  private searchUrls = [
    "/bikes/",
    "/bikes/e-mountainbikes/",
    "/bikes/e-trekkingbikes/",
    "/bikes/e-citybikes/",
    "/bikes/e-cargobikes/",
    "/bikes/e-roadbikes/",
  ];

  async fetchBikes(): Promise<Bike[]> {
    const results = await Promise.allSettled(
      this.searchUrls.map(async (path) => {
        const html = await this.fetchPage(`${this.baseUrl}${path}`);
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
        console.error(`[Riese & Müller] Error fetching ${path}:`, result.reason);
        this.recordError(result.reason instanceof Error ? result.reason.message : String(result.reason));
      }
    }
    return this.stampAndRecord(allBikes);
  }

  protected parseListing(html: string, categoryPath: string): Bike[] {
    const $ = cheerio.load(html);
    const bikes: Bike[] = [];

    // JSON-LD first — Magento 2 / Hyvä typically embeds Product schema
    const jsonLdBikes = this.parseJsonLdProducts($, categoryPath, "Riese & Müller")
      .map(b => ({ ...b, category: (b.category === "Sonstige" ? "E-Bike" : b.category) as typeof b.category }));
    if (jsonLdBikes.length > 0) return jsonLdBikes;

    // Fallback: Magento 2 / Hyvä product card selectors
    const cards = $(
      ".product-item, .item.product, [data-product-id], " +
      ".bike-card, [class*='product-card']"
    );

    cards.each((_, el) => {
      try {
        const $el = $(el);

        const name =
          $el.find(".product-item-name a, .product-name a, h2 a, h3 a").first().text().trim();
        if (!name) return;

        // Hyvä / Magento price selectors
        const salePriceText =
          $el.find(".special-price .price, .price-box .price").first().text().trim();
        const regularPriceText =
          $el.find(".regular-price .price, .old-price .price").first().text().trim();
        const priceText = salePriceText || regularPriceText;
        const price = this.parsePrice(priceText);
        if (!price) return;

        const listPrice = salePriceText && regularPriceText
          ? (this.parsePrice(regularPriceText) ?? undefined)
          : undefined;

        const href = $el.find("a.product-item-link, a[href]").first().attr("href") || "";
        const dealerUrl = href.startsWith("http") ? href : `${this.baseUrl}${href}`;
        if (!href) return;

        const imageUrl =
          $el.find("img").first().attr("data-src") ||
          $el.find("img").first().attr("src") ||
          undefined;

        const sourceId = $el.attr("data-product-id") || undefined;
        // All R&M bikes are E-Bikes
        const category = this.mapCategory(categoryPath.replace(/\//g, " ") || "e-bike");

        const result = BikeSchema.safeParse({
          name,
          brand: "Riese & Müller",
          category: category === "Sonstige" ? "E-Bike" : category,
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
