import * as cheerio from "cheerio";
import type { Bike, BikeCategory, AdapterHealth } from "./types";
import { BikeSchema } from "./types";

export abstract class BaseAdapter {
  abstract readonly name: string;
  abstract fetchBikes(): Promise<Bike[]>;

  /** Cache TTL in milliseconds. Override in subclasses for per-adapter control. */
  readonly cacheTtlMs: number = 15 * 60 * 1000; // 15 min default

  private _lastFetchAt: Date | null = null;
  private _lastError: string | null = null;
  private _lastWarning: string | null = null;
  private _listingCount: number = 0;

  getHealth(): AdapterHealth {
    return {
      name: this.name,
      isHealthy: this._lastError === null && this._lastFetchAt !== null,
      lastFetchAt: this._lastFetchAt,
      lastError: this._lastError,
      lastWarning: this._lastWarning,
      listingCount: this._listingCount,
      cacheTtlMs: this.cacheTtlMs,
    };
  }

  protected recordSuccess(count: number): void {
    this._lastFetchAt = new Date();
    this._lastError = null;
    this._listingCount = count;
    if (count === 0) {
      this._lastWarning = "0 Bikes geparst — Selektoren veraltet?";
    } else {
      this._lastWarning = null;
    }
  }

  protected recordError(error: string): void {
    this._lastError = error;
  }

  protected async fetchPage(url: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55_000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
          "Accept-Encoding": "gzip, deflate, br",
          "Cache-Control": "no-cache",
        },
      });
      const text = await response.text();
      console.log(
        `[${this.name}] ${url} → HTTP ${response.status}, ${text.length} bytes`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
      return text;
    } finally {
      clearTimeout(timeout);
    }
  }

  protected async fetchJson<T>(url: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55_000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "application/json",
          "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache",
        },
      });
      console.log(`[${this.name}] ${url} → HTTP ${response.status} (JSON)`);
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
      return response.json() as Promise<T>;
    } finally {
      clearTimeout(timeout);
    }
  }

  protected mapCategory(raw: string): BikeCategory {
    const lower = raw.toLowerCase();
    if (lower.includes("e-bike") || lower.includes("ebike") ||
        lower.includes("elektro") || lower.includes("electric") ||
        lower.includes("pedelec")) return "E-Bike";
    if (lower.includes("trekking") || lower.includes("touring") ||
        lower.includes("reiserad")) return "Trekking";
    if (lower.includes("city") || lower.includes("urban") ||
        lower.includes("commuter") || lower.includes("hybrid") ||
        lower.includes("lifestyle")) return "City";
    if (lower.includes("mountain") || lower.includes("mtb") ||
        lower.includes("fatbike") || lower.includes("fat bike") ||
        lower.includes("enduro") || lower.includes("trail")) return "Mountainbike";
    if (lower.includes("gravel") || lower.includes("cyclocross") ||
        lower.includes("crossrad") || lower.includes("crossbike")) return "Gravel";
    if (lower.includes("rennrad") || lower.includes("rennrae") ||
        lower.includes("road") || lower.includes("race") ||
        lower.includes("fixie") || lower.includes("fixed")) return "Rennrad";
    if (lower.includes("cargo") || lower.includes("lasten") ||
        lower.includes("transport") || lower.includes("bakfiets")) return "Cargo";
    if (lower.includes("kinder") || lower.includes("jugend") ||
        lower.includes("kids") || lower.includes("junior") ||
        lower.includes("bmx")) return "Kinder";
    return "Sonstige";
  }

  protected parsePrice(raw: string): number | null {
    const cleaned = raw.replace(/[^\d.,]/g, "").replace(/\.(?=\d{3})/g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) || num <= 0 ? null : num;
  }

  /** Infer all name-derived fields in a single pass (one toLowerCase call). */
  protected inferFromName(name: string): {
    driveType?: "belt" | "shaft";
    modelYear?: number;
    batteryWh?: number;
    suspension?: "fully" | "hardtail" | "front" | "rigid";
  } {
    const lower = name.toLowerCase();

    let driveType: "belt" | "shaft" | undefined;
    if (lower.includes("riemen") || lower.includes(" belt") || lower.includes("gates")) driveType = "belt";
    else if (lower.includes("kardan") || lower.includes("shaft")) driveType = "shaft";

    const yearMatch = name.match(/\b(20[12]\d)\b/);
    const modelYear = yearMatch ? parseInt(yearMatch[1], 10) : undefined;

    const whMatch = name.match(/\b(\d{3,4})\s*[Ww][Hh]\b/);
    let batteryWh: number | undefined;
    if (whMatch) {
      const wh = parseInt(whMatch[1], 10);
      batteryWh = wh >= 100 && wh <= 2000 ? wh : undefined;
    }

    let suspension: "fully" | "hardtail" | "front" | "rigid" | undefined;
    if (lower.includes("fully") || lower.includes("vollfeder") || lower.includes("full suspension")) suspension = "fully";
    else if (lower.includes("hardtail") || lower.includes("hard tail")) suspension = "hardtail";
    else if (lower.includes("federgabel") || lower.includes("front suspension")) suspension = "front";
    else if (lower.includes(" starr") || lower.includes("rigid")) suspension = "rigid";

    return { driveType, modelYear, batteryWh, suspension };
  }

  protected inferDriveType(name: string): "belt" | "shaft" | undefined {
    return this.inferFromName(name).driveType;
  }

  protected inferModelYear(name: string): number | undefined {
    return this.inferFromName(name).modelYear;
  }

  protected inferBatteryWh(name: string): number | undefined {
    return this.inferFromName(name).batteryWh;
  }

  protected inferSuspension(name: string): "fully" | "hardtail" | "front" | "rigid" | undefined {
    return this.inferFromName(name).suspension;
  }

  protected extractBrand(productName: string): string {
    const knownBrands = [
      "Cube", "Canyon", "Kalkhoff", "Stevens", "Bergamont", "Specialized",
      "Trek", "Giant", "Scott", "Merida", "KTM", "Haibike", "Focus",
      "Bulls", "Gazelle", "Winora", "Hercules", "Pegasus", "Puky",
      "Centurion", "Ghost", "Orbea", "Cannondale", "Bianchi", "BMC",
      "Lapierre", "Koga", "Batavus", "Victoria", "Diamant", "Tern",
      "Brompton", "Kettler", "Prophete", "Fischer", "NCM", "Coboc",
      "Riese", "Flyer", "Stromer", "Brose", "Bosch",
    ];
    for (const brand of knownBrands) {
      if (productName.toLowerCase().startsWith(brand.toLowerCase())) return brand;
    }
    return productName.split(/\s+/)[0] || "Unbekannt";
  }

  /**
   * Extract bike listings from `application/ld+json` structured data.
   *
   * Handles all common JSON-LD patterns found on bike shop category pages:
   *   - Top-level `@type: "Product"`
   *   - `@type: "ItemList"` with `itemListElement` array
   *   - `@graph` array containing Product nodes
   *   - Bare array of JSON-LD objects
   *
   * @param $            - Loaded Cheerio document
   * @param categoryPath - URL path used to derive category via mapCategory
   * @param defaultBrand - Brand to use when not present in the schema.
   *                       For single-brand shops pass the brand name (e.g. "Cube").
   *                       Omit for multi-brand retailers — falls back to extractBrand().
   */
  protected parseJsonLdProducts(
    $: cheerio.CheerioAPI,
    categoryPath: string,
    defaultBrand?: string
  ): Bike[] {
    const bikes: Bike[] = [];

    $("script[type='application/ld+json']").each((_, el) => {
      try {
        const raw: unknown = JSON.parse($(el).html() ?? "");
        if (!raw || typeof raw !== "object") return;

        // Collect Product nodes from various JSON-LD patterns
        const productNodes: unknown[] = [];
        const root = raw as Record<string, unknown>;

        if (root["@type"] === "Product") {
          productNodes.push(root);
        } else if (root["@type"] === "ItemList") {
          for (const entry of (root.itemListElement as unknown[] | undefined) ?? []) {
            if (!entry || typeof entry !== "object") continue;
            const node = (entry as Record<string, unknown>).item ?? entry;
            productNodes.push(node);
          }
        } else if (Array.isArray(root["@graph"])) {
          for (const node of root["@graph"] as unknown[]) {
            if (node && typeof node === "object" &&
                (node as Record<string, unknown>)["@type"] === "Product") {
              productNodes.push(node);
            }
          }
        } else if (Array.isArray(raw)) {
          for (const item of raw as unknown[]) {
            if (item && typeof item === "object" &&
                (item as Record<string, unknown>)["@type"] === "Product") {
              productNodes.push(item);
            }
          }
        }

        for (const rawNode of productNodes) {
          if (!rawNode || typeof rawNode !== "object") continue;
          const p = rawNode as Record<string, unknown>;
          if ((p["@type"] as string) !== "Product") continue;

          const name = (p.name as string)?.trim();
          if (!name) continue;

          // Brand: prefer schema.brand.name, then explicit default, then extractBrand
          const schemaBrand = (p.brand as Record<string, unknown> | undefined)?.name as string | undefined;
          const brand = schemaBrand || defaultBrand || this.extractBrand(name);

          // Offers: normalize to array, use first entry
          const rawOffers = p.offers;
          const offer = (Array.isArray(rawOffers) ? rawOffers[0] : rawOffers) as
            | Record<string, unknown>
            | undefined;
          if (!offer) continue;

          const price = this.parsePrice(String(offer.price ?? ""));
          if (!price) continue;

          // List price from highPrice or priceSpecification
          const listPrice = offer.highPrice
            ? (this.parsePrice(String(offer.highPrice)) ?? undefined)
            : undefined;

          const dealerUrl = (offer.url as string) || (p.url as string) || "";
          if (!dealerUrl.startsWith("http")) continue;

          const imageRaw = p.image;
          const imageUrl = (Array.isArray(imageRaw) ? (imageRaw[0] as string) : (imageRaw as string | undefined)) ?? undefined;
          const category = this.mapCategory(categoryPath.replace(/\//g, " "));

          const result = BikeSchema.safeParse({
            name,
            brand,
            category,
            price: listPrice && price < listPrice ? price : price,
            listPrice: listPrice && listPrice > price ? listPrice : undefined,
            offerPrice: listPrice && price < listPrice ? price : undefined,
            dealer: this.name,
            dealerUrl,
            imageUrl: imageUrl || undefined,
            sourceId: (p.sku as string) || (p.productID as string) || undefined,
            sourceType: "scrape" as const,
            ...this.inferFromName(name),
          });
          if (result.success) bikes.push(result.data);
        }
      } catch { /* malformed JSON-LD — skip */ }
    });

    return bikes;
  }

  /** Stamp lastSeenAt onto all bikes and handle health recording */
  protected stampAndRecord(bikes: Bike[]): Bike[] {
    const lastSeenAt = new Date().toISOString();
    const stamped = bikes.map((b) => ({ ...b, lastSeenAt }));
    this.recordSuccess(stamped.length);
    return stamped;
  }
}
