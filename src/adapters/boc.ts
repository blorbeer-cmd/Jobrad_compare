import { ShopifyAdapter, type ShopifyCollection } from "./shopify-adapter";

/**
 * B.O.C. adapter (boc24.de).
 *
 * boc24.de runs on Shopify (confirmed by product-card custom elements and
 * /collections/ URL structure). We use Shopify's public JSON API instead of
 * HTML scraping — more reliable, structured data, no selector fragility.
 *
 * API endpoint: /collections/{handle}/products.json?limit=250
 * No auth required. Returns up to 250 products per collection.
 */
export class BOCAdapter extends ShopifyAdapter {
  readonly name = "B.O.C.";
  readonly cacheTtlMs = 6 * 60 * 60 * 1000; // 6 hours

  readonly baseUrl = "https://www.boc24.de";
  readonly collections: ShopifyCollection[] = [
    { handle: "e-bikes", category: "E-Bike" },
    { handle: "e-bikes-trekking", category: "E-Bike" },
    { handle: "e-bikes-city", category: "E-Bike" },
    { handle: "e-mountainbikes", category: "E-Bike" },
    { handle: "e-bikes-cross", category: "E-Bike" },
    { handle: "e-lastenfahrrad", category: "Cargo" },
    { handle: "e-bikes-rennraeder", category: "E-Bike" },
    { handle: "trekkingraeder", category: "Trekking" },
  ];
}
