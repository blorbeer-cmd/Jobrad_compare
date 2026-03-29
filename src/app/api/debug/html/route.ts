import { NextResponse } from "next/server";

/**
 * Diagnostic endpoint: fetches one page from each dealer and returns
 * a snippet of the HTML plus selector match counts.
 * DELETE THIS FILE once adapters are working.
 */

const targets = [
  {
    dealer: "Fahrrad XXL",
    url: "https://www.fahrrad-xxl.de/fahrraeder/e-bike/?jobrad=1",
    cardSelectors: [".product-card", ".product-item", "[data-product-id]", "article", ".product", "[data-product]", ".ProductCard", ".product-listing__item", ".listing--product"],
    nameSelectors: [".product-title", ".product-name", "h3 a", "h2 a", "a[title]", ".product-card__title", ".product-card__name"],
    priceSelectors: [".price", ".product-price", ".current-price", ".product-card__price", ".price--current"],
  },
  {
    dealer: "Lucky Bike",
    url: "https://www.lucky-bike.de/Fahrraeder/E-Bike/",
    cardSelectors: [".product--box", ".product-box", "[data-product-id]", "article", ".product", "[data-product]", ".ProductCard", ".product-listing__item", ".listing--product", ".product-card"],
    nameSelectors: [".product--title", ".product-name", ".product-title a", "a[title]", ".product-card__title"],
    priceSelectors: [".product--price", ".price--default", ".product-price", ".price", ".product-card__price"],
  },
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

      // Use cheerio to test selectors
      const cheerio = await import("cheerio");
      const $ = cheerio.load(html);

      const selectorResults: Record<string, number> = {};
      for (const sel of target.cardSelectors) {
        const count = $(sel).length;
        if (count > 0) selectorResults[sel] = count;
      }

      // Find first element that looks like a product and get its HTML
      let sampleCardHtml = "";
      for (const sel of target.cardSelectors) {
        if ($(sel).length > 0) {
          sampleCardHtml = $(sel).first().html()?.slice(0, 3000) ?? "";
          break;
        }
      }

      // Try common parent elements that contain product-like content
      const bodyClasses = $("body").attr("class") || "";
      const mainContent = $("main, #content, .content, [role='main']").first();
      const mainClasses = mainContent.attr("class") || "";

      // Get all unique class names from direct children of the listing area
      const listingArea = $("main .listing, main .products, main .product-list, main [class*='product'], main [class*='listing'], main ul, main ol, .content-listing").first();
      const listingHtml = listingArea.html()?.slice(0, 2000) ?? "";

      // Sample of all elements with 'product' in class name
      const productElements: string[] = [];
      $("[class*='product'], [class*='Product']").slice(0, 5).each((_, el) => {
        const tag = el.type === "tag" ? el.tagName : "?";
        const cls = $(el).attr("class") || "";
        productElements.push(`<${tag} class="${cls}">`);
      });

      // Sample of first 5000 chars of a section that likely contains products
      const contentSample = $("main, #content, .content").first().html()?.slice(0, 5000) ?? html.slice(0, 5000);

      results.push({
        dealer: target.dealer,
        status: response.status,
        htmlLength: html.length,
        bodyClasses,
        mainClasses,
        selectorMatches: selectorResults,
        productElements,
        sampleCardHtml: sampleCardHtml.slice(0, 2000),
        listingHtml: listingHtml.slice(0, 2000),
        contentSample: contentSample.slice(0, 5000),
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
