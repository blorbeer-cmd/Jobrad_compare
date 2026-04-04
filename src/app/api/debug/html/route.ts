import { NextResponse } from "next/server";

/**
 * Diagnostic endpoint: fetches one page from each dealer and returns
 * a snippet of the HTML plus selector match counts.
 * DELETE THIS FILE once adapters are working.
 */

const targets = [
  { dealer: "B.O.C. E-Bikes", url: "https://www.boc24.de/collections/e-bikes" },
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

      const totalCards = $(".product-card").length;

      // Detailed analysis of first 3 product cards
      const cardAnalysis: object[] = [];
      $(".product-card").slice(0, 3).each((i, el) => {
        const $el = $(el);
        // Get full outer HTML of the card (truncated)
        const outerHtml = $.html(el).slice(0, 4000);
        // Get all text content
        const textContent = $el.text().replace(/\s+/g, " ").trim().slice(0, 500);
        // Find all links
        const links: string[] = [];
        $el.find("a[href]").each((_, a) => {
          links.push($(a).attr("href") || "");
        });
        // Find all elements with price-related classes
        const priceEls: string[] = [];
        $el.find("[class*='price'], [class*='Price']").each((_, pe) => {
          const cls = $(pe).attr("class") || "";
          const text = $(pe).text().trim().slice(0, 100);
          priceEls.push(`<${pe.type === "tag" ? pe.tagName : "?"} class="${cls}"> → "${text}"`);
        });
        cardAnalysis.push({ index: i, textContent, links, priceEls, outerHtml });
      });

      // Also find all Shopify collection URLs for other categories
      const collectionLinks: string[] = [];
      $("a[href*='/collections/']").each((_, a) => {
        const href = $(a).attr("href") || "";
        if (!collectionLinks.includes(href) && href.includes("bike") || href.includes("rad") || href.includes("trek") || href.includes("city") || href.includes("mountain")) {
          collectionLinks.push(href);
        }
      });

      results.push({
        dealer: target.dealer,
        status: response.status,
        htmlLength: html.length,
        totalCards,
        collectionLinks: [...new Set(collectionLinks)].slice(0, 20),
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
