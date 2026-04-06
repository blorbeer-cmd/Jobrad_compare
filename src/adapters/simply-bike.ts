import { ShopifyAdapter, type ShopifyCollection } from "./shopify-adapter";

/**
 * Simply Bike adapter (simply.bike).
 *
 * simply.bike runs on Shopify. We use Shopify's public JSON API instead of
 * HTML scraping — more reliable, structured data, no selector fragility.
 *
 * We fetch from /products.json (all products) rather than individual
 * collections, because Shopify collection handles vary per store and
 * may not match the expected English slugs. Category is derived from
 * each product's product_type field via mapCategory().
 */
export class SimplyBikeAdapter extends ShopifyAdapter {
  readonly name = "Simply Bike";
  readonly cacheTtlMs = 6 * 60 * 60 * 1000; // 6 hours

  readonly baseUrl = "https://simply.bike";
  // "all" triggers the /products.json endpoint; category falls back to
  // mapCategory(product.product_type) in ShopifyAdapter.parseShopifyProducts
  readonly collections: ShopifyCollection[] = [
    { handle: "all", category: "Sonstige" },
  ];
}
