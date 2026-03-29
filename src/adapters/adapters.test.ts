/**
 * Adapter contract tests.
 *
 * These tests verify that each dealer adapter:
 *  1. Correctly parses HTML product cards into the unified Bike schema
 *  2. Properly extracts name, price, listPrice, dealerUrl, imageUrl, availability
 *  3. Skips entries with missing required fields (name / price)
 *  4. Handles empty pages gracefully (returns empty array, no throw)
 *  5. Handles completely garbled HTML gracefully
 *  6. Sets sourceType = "scrape" on every returned bike
 *  7. Sets lastSeenAt on every returned bike
 *
 * Each test loads a static HTML fixture that mirrors real shop markup for the
 * CSS selectors each adapter uses. When a shop changes its HTML structure and
 * the fixture still passes but live data breaks, update the fixture to match.
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { describe, it, expect } from "vitest";
import { FahrradXXLAdapter } from "./fahrrad-xxl";
import { LuckyBikeAdapter } from "./lucky-bike";
import { BikeDiscountAdapter } from "./bike-discount";
import type { Bike } from "./types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) =>
  readFileSync(join(__dirname, "__fixtures__", name), "utf-8");

// ---------------------------------------------------------------------------
// Test subclasses that expose protected parseListing for direct testing
// ---------------------------------------------------------------------------

// stampAndRecord adds lastSeenAt + sourceType, mirroring the real fetchBikes pipeline
class TestFahrradXXL extends FahrradXXLAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestLuckyBike extends LuckyBikeAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestBikeDiscount extends BikeDiscountAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

// ---------------------------------------------------------------------------
// Shared contract assertions
// ---------------------------------------------------------------------------

function assertBikeContract(bike: Bike, adapterName: string) {
  expect(bike.name.length).toBeGreaterThan(0);
  expect(bike.brand.length).toBeGreaterThan(0);
  expect(bike.price).toBeGreaterThan(0);
  expect(bike.dealer).toBe(adapterName);
  expect(bike.dealerUrl).toMatch(/^https?:\/\//);
  expect(bike.sourceType).toBe("scrape");
  expect(bike.lastSeenAt).toBeDefined();
  expect(() => new Date(bike.lastSeenAt!)).not.toThrow();
}

// ---------------------------------------------------------------------------
// Fahrrad XXL
// ---------------------------------------------------------------------------

describe("FahrradXXLAdapter contract", () => {
  const adapter = new TestFahrradXXL();
  const html = fixture("fahrrad-xxl-ebikes.html");
  const bikes = adapter.parse(html, "/fahrraeder/e-bike/");

  it("parses 3 valid bikes and skips 2 invalid cards", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Fahrrad XXL");
  });

  it("parses Carver sale bike with offer price and list price", () => {
    const carver = bikes.find((b) => b.name.includes("Carver"));
    expect(carver).toBeDefined();
    expect(carver!.price).toBe(1799.99);
    expect(carver!.listPrice).toBe(2699.99);
    expect(carver!.offerPrice).toBe(1799.99);
    expect(carver!.brand).toBe("Carver");
    expect(carver!.category).toBe("E-Bike");
  });

  it("parses Trek Domane without discount", () => {
    const trek = bikes.find((b) => b.name.includes("Trek"));
    expect(trek).toBeDefined();
    expect(trek!.price).toBe(2999);
    expect(trek!.listPrice).toBeUndefined();
    expect(trek!.brand).toBe("Trek");
  });

  it("parses Giant with sale price", () => {
    const giant = bikes.find((b) => b.name.includes("Giant"));
    expect(giant).toBeDefined();
    expect(giant!.price).toBe(3499);
    expect(giant!.listPrice).toBe(3899);
  });

  it("parses image URL from src attribute", () => {
    const trek = bikes.find((b) => b.name.includes("Trek"));
    expect(trek?.imageUrl).toMatch(/^https?:\/\//);
  });

  it("sets sourceId from data-product-id attribute", () => {
    const carver = bikes.find((b) => b.name.includes("Carver"));
    expect(carver?.sourceId).toBe("581912");
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/fahrraeder/e-bike/")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<<!>>#$%@!GARBLED", "/fahrraeder/e-bike/")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Lucky Bike
// ---------------------------------------------------------------------------

describe("LuckyBikeAdapter contract", () => {
  const adapter = new TestLuckyBike();
  const html = fixture("lucky-bike-ebikes.html");
  const bikes = adapter.parse(html, "/e-bikes/");

  it("parses 3 valid bikes and skips 1 invalid card", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Lucky Bike");
  });

  it("parses Kalkhoff with offer price and list price", () => {
    const kalkhoff = bikes.find((b) => b.name.includes("Kalkhoff"));
    expect(kalkhoff).toBeDefined();
    expect(kalkhoff!.price).toBe(3499);
    expect(kalkhoff!.listPrice).toBe(3699);
    expect(kalkhoff!.offerPrice).toBe(3499);
    expect(kalkhoff!.category).toBe("E-Bike");
  });

  it("parses Bergamont without discount", () => {
    const bergamont = bikes.find((b) => b.name.includes("Bergamont"));
    expect(bergamont).toBeDefined();
    expect(bergamont!.price).toBe(799);
    expect(bergamont!.listPrice).toBeUndefined();
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/e-bikes/")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/e-bikes/")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Bike Discount
// ---------------------------------------------------------------------------

describe("BikeDiscountAdapter contract", () => {
  const adapter = new TestBikeDiscount();
  const html = fixture("bike-discount-ebikes.html");
  const bikes = adapter.parse(html, "/fahrraeder/e-bikes");

  it("parses 3 valid bikes and skips 2 invalid cards", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Bike-Discount");
  });

  it("parses Haibike with offer price and list price", () => {
    const haibike = bikes.find((b) => b.name.includes("Haibike"));
    expect(haibike).toBeDefined();
    expect(haibike!.price).toBe(4599);
    expect(haibike!.listPrice).toBe(4999);
    expect(haibike!.category).toBe("E-Bike");
  });

  it("parses Specialized without discount", () => {
    const specialized = bikes.find((b) => b.name.includes("Specialized"));
    expect(specialized).toBeDefined();
    expect(specialized!.price).toBe(1499);
    expect(specialized!.listPrice).toBeUndefined();
    expect(specialized!.availability).toBeTruthy();
  });

  it("parses product from productCard class", () => {
    const merida = bikes.find((b) => b.name.includes("Merida"));
    expect(merida).toBeDefined();
    expect(merida!.price).toBe(1999);
  });

  it("sets sourceId from data-product attribute", () => {
    const haibike = bikes.find((b) => b.name.includes("Haibike"));
    expect(haibike?.sourceId).toBe("haibike-allmtn-6");
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/fahrraeder/e-bikes")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/fahrraeder/e-bikes")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Cross-adapter: all parsed bikes pass the unified BikeSchema
// ---------------------------------------------------------------------------

describe("All adapters: unified schema compliance", () => {
  const cases: [string, TestFahrradXXL | TestLuckyBike | TestBikeDiscount, string, string][] = [
    [
      "fahrrad-xxl-ebikes.html",
      new TestFahrradXXL(),
      "/fahrraeder/e-bikes",
      "Fahrrad XXL",
    ],
    ["lucky-bike-ebikes.html", new TestLuckyBike(), "/e-bikes/", "Lucky Bike"],
    [
      "bike-discount-ebikes.html",
      new TestBikeDiscount(),
      "/fahrraeder/e-bikes",
      "Bike-Discount",
    ],
  ];

  for (const [fixtureName, adapter, path, dealerName] of cases) {
    it(`${dealerName}: all bikes pass BikeSchema validation`, async () => {
      const { BikeSchema } = await import("./types");
      const html = fixture(fixtureName);
      const bikes = adapter.parse(html, path);
      expect(bikes.length).toBeGreaterThan(0);
      for (const bike of bikes) {
        const result = BikeSchema.safeParse(bike);
        expect(result.success, `Schema failed for: ${JSON.stringify(bike)}`).toBe(true);
      }
    });
  }
});
