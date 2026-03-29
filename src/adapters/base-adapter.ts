import type { Bike, BikeCategory, AdapterHealth } from "./types";

export abstract class BaseAdapter {
  abstract readonly name: string;
  abstract fetchBikes(): Promise<Bike[]>;

  /** Cache TTL in milliseconds. Override in subclasses for per-adapter control. */
  readonly cacheTtlMs: number = 15 * 60 * 1000; // 15 min default

  private _lastFetchAt: Date | null = null;
  private _lastError: string | null = null;
  private _listingCount: number = 0;

  getHealth(): AdapterHealth {
    return {
      name: this.name,
      isHealthy: this._lastError === null && this._lastFetchAt !== null,
      lastFetchAt: this._lastFetchAt,
      lastError: this._lastError,
      listingCount: this._listingCount,
      cacheTtlMs: this.cacheTtlMs,
    };
  }

  protected recordSuccess(count: number): void {
    this._lastFetchAt = new Date();
    this._lastError = null;
    this._listingCount = count;
  }

  protected recordError(error: string): void {
    this._lastError = error;
  }

  protected async fetchPage(url: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
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

  protected mapCategory(raw: string): BikeCategory {
    const lower = raw.toLowerCase();
    if (lower.includes("e-bike") || lower.includes("ebike") || lower.includes("elektro")) return "E-Bike";
    if (lower.includes("city") || lower.includes("urban")) return "City";
    if (lower.includes("trekking") || lower.includes("touring")) return "Trekking";
    if (lower.includes("mountain") || lower.includes("mtb")) return "Mountainbike";
    if (lower.includes("gravel") || lower.includes("cyclocross") || lower.includes("crossrad") || lower.includes("crossbike")) return "Gravel";
    if (lower.includes("rennrad") || lower.includes("rennrae") || lower.includes("road") || lower.includes("race")) return "Rennrad";
    if (lower.includes("cargo") || lower.includes("lasten") || lower.includes("transport")) return "Cargo";
    if (lower.includes("kinder") || lower.includes("jugend") || lower.includes("kids")) return "Kinder";
    return "Sonstige";
  }

  protected parsePrice(raw: string): number | null {
    const cleaned = raw.replace(/[^\d.,]/g, "").replace(/\.(?=\d{3})/g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) || num <= 0 ? null : num;
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

  /** Stamp lastSeenAt onto all bikes and handle health recording */
  protected stampAndRecord(bikes: Bike[]): Bike[] {
    const lastSeenAt = new Date().toISOString();
    const stamped = bikes.map((b) => ({ ...b, lastSeenAt }));
    this.recordSuccess(stamped.length);
    return stamped;
  }
}
