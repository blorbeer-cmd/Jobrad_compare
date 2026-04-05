/**
 * Tests for the Awin product feed adapter.
 *
 * Uses a static TSV fixture that mirrors the real Awin feed column format.
 * Tests cover: correct field mapping, category filtering, price validation,
 * URL validation, battery/suspension inference from name, and edge cases.
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { describe, it, expect } from "vitest";
import { AwinFeedAdapter } from "./awin-feed-adapter";
import type { Bike } from "./types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const tsv = readFileSync(join(__dirname, "__fixtures__", "awin-feed.tsv"), "utf-8");

// Expose parseFeed for testing without needing an API key
class TestAwinAdapter extends AwinFeedAdapter {
  readonly name = "Test Dealer";
  readonly feedId = 99999;
  parse(feed: string): Bike[] {
    return this.stampAndRecord(this.parseFeed(feed));
  }
}

describe("AwinFeedAdapter", () => {
  const adapter = new TestAwinAdapter();
  const bikes = adapter.parse(tsv);

  it("parses 4 valid bikes and skips non-bike category, missing price, missing URL", () => {
    // AW-004 (helmet) skipped — non-bike category
    // AW-006 skipped — price 0.00
    // AW-007 skipped — empty URL
    expect(bikes.length).toBe(4);
  });

  it("each bike has required fields", () => {
    for (const bike of bikes) {
      expect(bike.name.length).toBeGreaterThan(0);
      expect(bike.brand.length).toBeGreaterThan(0);
      expect(bike.price).toBeGreaterThan(0);
      expect(bike.dealer).toBe("Test Dealer");
      expect(bike.dealerUrl).toMatch(/^https?:\/\//);
      expect(bike.sourceType).toBe("api");
      expect(bike.lastSeenAt).toBeDefined();
    }
  });

  it("parses Haibike with offer price and list price", () => {
    const bike = bikes.find((b) => b.name.includes("Haibike"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(3199);
    expect(bike!.listPrice).toBe(3599);
    expect(bike!.offerPrice).toBe(3199);
    expect(bike!.category).toBe("E-Bike");
    expect(bike!.brand).toBe("Haibike");
    expect(bike!.color).toBe("Schwarz");
  });

  it("parses Cube Touring without discount", () => {
    const bike = bikes.find((b) => b.name.includes("Cube Touring"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(1199);
    expect(bike!.listPrice).toBeUndefined();
    expect(bike!.category).toBe("Trekking");
  });

  it("parses Specialized Turbo Vado and infers 500 Wh battery from name", () => {
    const bike = bikes.find((b) => b.name.includes("Specialized"));
    expect(bike).toBeDefined();
    expect(bike!.batteryWh).toBe(500);
    expect(bike!.availability).toMatch(/Werktage/);
  });

  it("parses Puky Laufrad as Kinder category", () => {
    const bike = bikes.find((b) => b.name.includes("Puky"));
    expect(bike).toBeDefined();
    expect(bike!.category).toBe("Kinder");
    expect(bike!.brand).toBe("Puky");
  });

  it("sets availability from in_stock + delivery_time", () => {
    const haibike = bikes.find((b) => b.name.includes("Haibike"));
    expect(haibike!.availability).toBe("2-3 Werktage");
  });

  it("sets sourceType to 'api' (not 'scrape')", () => {
    for (const bike of bikes) {
      expect(bike.sourceType).toBe("api");
    }
  });

  it("sets sourceId from aw_product_id", () => {
    const haibike = bikes.find((b) => b.name.includes("Haibike"));
    expect(haibike!.sourceId).toBe("AW-001");
  });

  it("returns empty array for empty feed", () => {
    expect(adapter.parse("")).toEqual([]);
  });

  it("returns empty array for header-only feed", () => {
    const headerOnly = tsv.split("\n")[0];
    expect(adapter.parse(headerOnly)).toEqual([]);
  });

  it("returns empty array for completely garbled input", () => {
    expect(adapter.parse("<<GARBLED##")).toEqual([]);
  });
});
