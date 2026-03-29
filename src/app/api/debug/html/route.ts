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

      const cheerio = await import("cheerio");
      const $ = cheerio.load(html);

      const totalCards = $("[data-product-id]").length;

      // Analyze price structure of first 5 cards in detail
      const cardAnalysis: object[] = [];
      $("[data-product-id]").slice(0, 5).each((i, el) => {
        const $el = $(el);
        const brand = $el.find(".fxxl-element-artikel__brand").first().text().trim();
        const title = $el.find(".fxxl-element-artikel__title").first().text().trim();

        // Get ALL elements with "price" or "preis" in class name
        const priceElements: string[] = [];
        $el.find("[class*='price'], [class*='Price'], [class*='preis'], [class*='Preis']").each((_, pe) => {
          const cls = $(pe).attr("class") || "";
          const text = $(pe).text().trim().slice(0, 100);
          priceElements.push(`<${pe.type === "tag" ? pe.tagName : "?"} class="${cls}"> → "${text}"`);
        });

        // Get all elements containing "€" symbol
        const euroElements: string[] = [];
        $el.find("*").each((_, child) => {
          const text = $(child).text().trim();
          // Only direct text content (not inherited from children)
          const ownText = $(child).contents().filter(function() { return this.type === "text"; }).text().trim();
          if (ownText.includes("€") || ownText.includes("EUR")) {
            const cls = $(child).attr("class") || "";
            const tag = child.type === "tag" ? child.tagName : "?";
            euroElements.push(`<${tag} class="${cls}"> → "${ownText.slice(0, 100)}"`);
          }
        });

        // Full inner HTML of card (truncated)
        const cardHtml = $el.html()?.slice(0, 3000) ?? "";

        cardAnalysis.push({
          index: i,
          brand,
          title,
          priceElements,
          euroElements,
          cardHtml,
        });
      });

      results.push({
        dealer: target.dealer,
        status: response.status,
        htmlLength: html.length,
        totalCards,
        cardAnalysis,
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
