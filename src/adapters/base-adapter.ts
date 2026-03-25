import type { Bike, BikeCategory } from "./types";

export abstract class BaseAdapter {
  abstract name: string;
  abstract fetchBikes(): Promise<Bike[]>;

  protected async fetchPage(url: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; JobRadCompare/1.0)",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "de-DE,de;q=0.9",
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
      return await response.text();
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
    if (lower.includes("rennrad") || lower.includes("road") || lower.includes("race")) return "Rennrad";
    if (lower.includes("cargo") || lower.includes("lasten") || lower.includes("transport")) return "Cargo";
    if (lower.includes("gravel") || lower.includes("cross") || lower.includes("cyclocross")) return "Gravel";
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
    ];
    for (const brand of knownBrands) {
      if (productName.toLowerCase().startsWith(brand.toLowerCase())) return brand;
    }
    return productName.split(/\s+/)[0] || "Unbekannt";
  }
}
