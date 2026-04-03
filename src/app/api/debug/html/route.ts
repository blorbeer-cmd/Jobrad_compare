import { NextResponse } from "next/server";

/**
 * Diagnostic endpoint: fetches one page from each dealer and returns
 * a snippet of the HTML plus selector match counts.
 * DELETE THIS FILE once adapters are working.
 */

const targets = [
  { dealer: "B.O.C.", url: "https://www.boc24.de/fahrraeder/e-bikes/" },
  { dealer: "Stadler", url: "https://www.zweirad-stadler.de/e-bikes/" },
  { dealer: "Bike24", url: "https://www.bike24.de/e-bikes" },
  { dealer: "Bikester", url: "https://www.bikester.de/e-bikes/" },
  { dealer: "Radon", url: "https://www.radon-bikes.de/e-bike/" },
  { dealer: "Lucky Bike Suggest", url: "https://www.lucky-bike.de/suggest?search=e-bike" },
  { dealer: "Lucky Bike Widgets", url: "https://www.lucky-bike.de/widgets/listing/listingCount/Fahrraeder/E-Bike/" },
];

export async function GET() {
  const results = [];

  for (const target of targets) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);
      const response = await fetch(target.url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      });
      clearTimeout(timeout);
      const html = await response.text();

      const cheerio = await import("cheerio");
      const $ = cheerio.load(html);

      // Generic product detection: look for common product card selectors
      const productSelectors = [
        "[data-product-id]", ".product-card", ".product-box", ".product-item",
        ".product--box", "[data-product]", "article.product", ".productCard",
        ".product-listing__item", ".listing--product", ".product-tile",
      ];
      const selectorHits: Record<string, number> = {};
      for (const sel of productSelectors) {
        const count = $(sel).length;
        if (count > 0) selectorHits[sel] = count;
      }

      // Count euro signs in the page (indicator of prices)
      const euroCount = (html.match(/€/g) || []).length;

      // Look for elements with "product" in class
      const productClasses: string[] = [];
      $("[class*='product'], [class*='Product']").slice(0, 8).each((_, el) => {
        const tag = el.type === "tag" ? el.tagName : "?";
        const cls = $(el).attr("class") || "";
        const text = $(el).text().trim().slice(0, 80);
        productClasses.push(`<${tag} class="${cls}"> → "${text}"`);
      });

      // First 2000 chars of body content for inspection
      const bodySnippet = $("body").text().trim().slice(0, 2000);

      results.push({
        dealer: target.dealer,
        status: response.status,
        htmlLength: html.length,
        euroCount,
        selectorHits,
        productClasses: productClasses.slice(0, 5),
        bodySnippet: bodySnippet.slice(0, 1000),
      });
    } catch (err) {
      results.push({
        dealer: target.dealer,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json(results, {
    headers: { "Content-Type": "application/json" },
  });
}
