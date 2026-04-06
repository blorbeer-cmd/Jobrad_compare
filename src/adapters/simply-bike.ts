import { ShopifyAdapter, type ShopifyCollection } from "./shopify-adapter";

/**
 * Simply Bike adapter (simply.bike).
 *
 * simply.bike runs on Shopify. We use Shopify's public JSON API instead of
 * HTML scraping — more reliable, structured data, no selector fragility.
 *
 * API endpoint: /collections/{handle}/products.json?limit=250
 * No auth required. Returns up to 250 products per collection.
 */
export class SimplyBikeAdapter extends ShopifyAdapter {
  readonly name = "Simply Bike";
  readonly cacheTtlMs = 6 * 60 * 60 * 1000; // 6 hours

  readonly baseUrl = "https://simply.bike";
  readonly collections: ShopifyCollection[] = [
    { handle: "e-bikes", category: "E-Bike" },
    { handle: "trekking-bikes", category: "Trekking" },
    { handle: "city-bikes", category: "City" },
    { handle: "mountain-bikes", category: "Mountainbike" },
    { handle: "road-bikes", category: "Rennrad" },
    { handle: "gravel-bikes", category: "Gravel" },
    { handle: "kids-bikes", category: "Kinder" },
    { handle: "cargo-bikes", category: "Cargo" },
  ];
}
