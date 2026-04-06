import type { Bike, BikeCategory } from "./types";
import { BikeSchema } from "./types";
import { BaseAdapter } from "./base-adapter";

export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  variants: Array<{
    id: number;
    price: string;
    compare_at_price: string | null;
  }>;
  images: Array<{ src: string }>;
}

export interface ShopifyCollection {
  /** Shopify collection handle, e.g. "e-bikes" */
  handle: string;
  /** Category to assign to all bikes in this collection */
  category: BikeCategory;
}

/**
 * Base class for Shopify-based dealer adapters.
 *
 * Uses Shopify's public `/collections/{handle}/products.json?limit=250`
 * endpoint instead of HTML scraping. This is more reliable than scraping
 * because:
 *  - Returns structured JSON — no HTML parsing fragility
 *  - Works regardless of client-side rendering
 *  - Always includes accurate prices, vendor, handle for deduplication
 *  - Publicly accessible without authentication (Shopify default)
 */
export abstract class ShopifyAdapter extends BaseAdapter {
  abstract readonly baseUrl: string;
  abstract readonly collections: ShopifyCollection[];

  async fetchBikes(): Promise<Bike[]> {
    const results = await Promise.allSettled(
      this.collections.map(({ handle, category }) =>
        this.fetchCollection(handle, category)
      )
    );

    const allBikes: Bike[] = [];
    const seenIds = new Set<string>();

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled") {
        for (const bike of result.value) {
          // Deduplicate across collections by Shopify product ID (or dealerUrl)
          const key = bike.sourceId ?? bike.dealerUrl;
          if (!seenIds.has(key)) {
            seenIds.add(key);
            allBikes.push(bike);
          }
        }
      } else {
        const handle = this.collections[i].handle;
        console.error(
          `[${this.name}] Error fetching collection "${handle}":`,
          result.reason
        );
        this.recordError(
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason)
        );
      }
    }
    return this.stampAndRecord(allBikes);
  }

  private async fetchCollection(
    handle: string,
    category: BikeCategory
  ): Promise<Bike[]> {
    // "all" is the Shopify built-in collection containing every product.
    // Other handles fetch a specific collection.
    const url = handle === "all"
      ? `${this.baseUrl}/products.json?limit=250`
      : `${this.baseUrl}/collections/${handle}/products.json?limit=250`;
    const data = await this.fetchJson<{ products: ShopifyProduct[] }>(url);
    return this.parseShopifyProducts(data.products ?? [], category);
  }

  protected parseShopifyProducts(
    products: ShopifyProduct[],
    category: BikeCategory
  ): Bike[] {
    const bikes: Bike[] = [];
    for (const product of products) {
      try {
        const variants = product.variants ?? [];
        if (variants.length === 0) continue;

        // Pick the cheapest variant as the representative price
        const sorted = [...variants].sort(
          (a, b) => parseFloat(a.price) - parseFloat(b.price)
        );
        const variant = sorted[0];

        const price = parseFloat(variant.price);
        const listPrice = variant.compare_at_price
          ? parseFloat(variant.compare_at_price)
          : undefined;

        if (!price || price <= 0) continue;

        const name = product.title;
        if (!name) continue;

        // Shopify vendor field is the brand
        const brand = product.vendor || this.extractBrand(name);
        const dealerUrl = `${this.baseUrl}/products/${product.handle}`;
        const imageUrl = product.images?.[0]?.src ?? undefined;

        // When fetching from /products.json (all collection), category is
        // "Sonstige" — derive the real category from the product_type field.
        const effectiveCategory: BikeCategory = category !== "Sonstige"
          ? category
          : this.mapCategory(product.product_type || name);

        // Skip accessories, clothing, locks, etc. that don't map to a bike
        // category. Only applies when using the "all" collection endpoint
        // (category === "Sonstige" initially).
        if (category === "Sonstige" && effectiveCategory === "Sonstige") continue;

        const result = BikeSchema.safeParse({
          name,
          brand,
          category: effectiveCategory,
          price: listPrice && price < listPrice ? price : price,
          listPrice: listPrice && listPrice > price ? listPrice : undefined,
          offerPrice: listPrice && price < listPrice ? price : undefined,
          dealer: this.name,
          dealerUrl,
          imageUrl,
          sourceId: String(product.id),
          sourceType: "api" as const,
          ...this.inferFromName(name),
        });
        if (result.success) bikes.push(result.data);
      } catch {
        /* skip malformed entries */
      }
    }
    return bikes;
  }
}
