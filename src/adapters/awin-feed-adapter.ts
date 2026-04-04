/**
 * Awin product feed adapter base class.
 *
 * Awin (awin.com) is Germany's largest affiliate network. Most major German
 * bike retailers publish structured product feeds as part of their affiliate
 * programme. This adapter fetches and parses those feeds — no HTML scraping
 * needed, giving us stable, structured data with all required fields.
 *
 * Setup (required once):
 *   1. Create a publisher account at awin.com
 *   2. Apply to each merchant's affiliate programme and get approved
 *   3. Note each merchant's Awin advertiser ID (shown on the programme page)
 *   4. Set AWIN_API_KEY (your publisher API token) and per-dealer
 *      AWIN_FEED_ID_* environment variables (see CLAUDE.md)
 *
 * Feed URL format:
 *   https://productdata.awin.com/datafeed/download/apikey/{key}/language/de
 *     /fid/{advertiserId}/columns/{cols}/format/csv/delimiter/tab/
 */

import type { Bike } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FEED_BASE = "https://productdata.awin.com/datafeed/download/apikey";

/** Columns we request from the feed — only what we need, keeps download small. */
const COLUMNS = [
  "aw_product_id",
  "merchant_product_id",
  "product_name",
  "aw_deep_link",
  "search_price",
  "rrp_price",
  "merchant_image_url",
  "colour",
  "brand_name",
  "in_stock",
  "delivery_time",
  "merchant_category",
].join(",");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AwinRow {
  aw_product_id: string;
  merchant_product_id: string;
  product_name: string;
  aw_deep_link: string;
  search_price: string;
  rrp_price: string;
  merchant_image_url: string;
  colour: string;
  brand_name: string;
  in_stock: string;
  delivery_time: string;
  merchant_category: string;
}

// ---------------------------------------------------------------------------
// Base class
// ---------------------------------------------------------------------------

export abstract class AwinFeedAdapter extends BaseAdapter {
  readonly cacheTtlMs = 6 * 60 * 60 * 1000; // 6 hours

  /**
   * Awin advertiser ID for this dealer.
   * Found on the programme page at awin.com/de/advertisers.
   * Typically set via an env var (e.g. AWIN_FEED_ID_HIBIKE).
   */
  abstract readonly feedId: number;

  async fetchBikes(): Promise<Bike[]> {
    const apiKey = process.env.AWIN_API_KEY;
    if (!apiKey) {
      // Silently skip — scraping fallback will handle this dealer
      return [];
    }
    if (!this.feedId) {
      // No feed ID configured for this dealer — skip
      return [];
    }

    const url = `${FEED_BASE}/${apiKey}/language/de/fid/${this.feedId}/columns/${COLUMNS}/format/csv/delimiter/tab/`;

    try {
      const tsv = await this.fetchPage(url);
      const bikes = this.parseFeed(tsv);
      return this.stampAndRecord(bikes);
    } catch (err) {
      this.recordError(err instanceof Error ? err.message : String(err));
      return [];
    }
  }

  /**
   * Parse the Awin TSV feed into Bike objects.
   * Public so tests can call it directly with fixture data.
   */
  parseFeed(tsv: string): Bike[] {
    const lines = tsv.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return [];

    // Parse header row — strip quotes that Awin sometimes adds
    const headers = lines[0].split("\t").map((h) => h.trim().replace(/^"|"$/g, ""));

    const bikes: Bike[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split("\t").map((v) => v.trim().replace(/^"|"$/g, ""));
        const row = Object.fromEntries(
          headers.map((h, j) => [h, values[j] ?? ""])
        ) as unknown as AwinRow;

        // Only process bike/cycling categories
        const cat = (row.merchant_category ?? "").toLowerCase();
        if (!this.isBikeCategory(cat)) continue;

        const name = row.product_name?.trim();
        if (!name) continue;

        const price = this.parsePrice(row.search_price);
        // Sanity-check: bike prices 50–20.000 € (Kinder balance bikes start ~€60)
        if (!price || price < 50 || price > 20_000) continue;

        const rrp = this.parsePrice(row.rrp_price);
        const listPrice = rrp && rrp > price ? rrp : undefined;

        const dealerUrl = row.aw_deep_link?.trim();
        if (!dealerUrl?.startsWith("http")) continue;

        const category = this.mapCategory(cat);
        const brand = row.brand_name?.trim() || this.extractBrand(name);

        // Awin in_stock = "1" means available
        const availability =
          row.in_stock === "1"
            ? row.delivery_time?.trim() || "Auf Lager"
            : row.delivery_time?.trim() || "Nicht verfügbar";

        const result = BikeSchema.safeParse({
          name,
          brand,
          category,
          price,
          listPrice,
          offerPrice: listPrice ? price : undefined,
          dealer: this.name,
          dealerUrl,
          imageUrl: row.merchant_image_url?.trim() || undefined,
          availability,
          sourceId: row.aw_product_id || row.merchant_product_id || undefined,
          sourceType: "api" as const,
          color: row.colour?.trim() || undefined,
          ...this.inferFromName(name),
        });
        if (result.success) bikes.push(result.data);
      } catch { /* skip malformed rows */ }
    }

    return bikes;
  }

  /** Returns true when the merchant_category string indicates a bicycle product. */
  private isBikeCategory(cat: string): boolean {
    return [
      "fahrrad", "fahrräd", "räder",   // Fahrrad / Fahrräder / Kinderfahrräder
      "bike", "ebike", "e-bike", "pedelec",
      "trekking", "mountainbike", "citybike", "rennrad", "gravelbike",
      "lastenrad", "cargo", "velo", "zweirad",
    ].some((kw) => cat.includes(kw));
  }
}
