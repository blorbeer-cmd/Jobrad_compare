import { describe, it, expect } from "vitest";
import {
  groupBikes,
  getMultiDealerGroups,
  summarizeResolution,
  toCanonicalKey,
} from "./entity-resolution";
import type { Bike } from "@/adapters/types";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeBike(overrides: Partial<Bike> & { name: string; brand: string; dealer: string; price: number }): Bike {
  return {
    category: "E-Bike",
    dealerUrl: `https://example.com/${overrides.name.replace(/\s+/g, "-").toLowerCase()}`,
    sourceType: "scrape",
    lastSeenAt: new Date().toISOString(),
    ...overrides,
  };
}

const cubeAtFahrradXXL = makeBike({ name: "Cube Touring Hybrid ONE 625", brand: "Cube", dealer: "Fahrrad XXL", price: 2799 });
const cubeAtLucky = makeBike({ name: "Cube Touring Hybrid ONE 625", brand: "Cube", dealer: "Lucky Bike", price: 2999 });
const cubeAtDiscount = makeBike({ name: "Cube Touring Hybrid ONE 625", brand: "Cube", dealer: "Bike-Discount", price: 3099 });

const trekAtFahrradXXL = makeBike({ name: "Trek FX 3 Disc", brand: "Trek", dealer: "Fahrrad XXL", price: 1099 });
const trekAtLucky = makeBike({ name: "Trek FX 3 Disc", brand: "Trek", dealer: "Lucky Bike", price: 1149 });

const uniqueBike = makeBike({ name: "Kalkhoff Entice 7", brand: "Kalkhoff", dealer: "Lucky Bike", price: 3499 });

// Fuzzy variant — model name with minor typo ("ONE 625" vs "ONE625")
const cubeFuzzy = makeBike({ name: "Cube Touring Hybrid ONE625", brand: "Cube", dealer: "Another Shop", price: 2850 });

// ---------------------------------------------------------------------------
// toCanonicalKey
// ---------------------------------------------------------------------------

describe("toCanonicalKey", () => {
  it("normalizes brand and model to slug:slug format", () => {
    expect(toCanonicalKey("Cube", "Touring Hybrid ONE 625")).toBe("cube:touring-hybrid-one-625");
  });

  it("strips special characters", () => {
    expect(toCanonicalKey("S-Works", "Tarmac SL7 (2024)")).toBe("s-works:tarmac-sl7-2024");
  });

  it("is case insensitive", () => {
    expect(toCanonicalKey("CUBE", "TOURING HYBRID ONE 625")).toBe(
      toCanonicalKey("cube", "touring hybrid one 625")
    );
  });
});

// ---------------------------------------------------------------------------
// groupBikes — exact matching
// ---------------------------------------------------------------------------

describe("groupBikes — exact matching", () => {
  const bikes = [cubeAtFahrradXXL, cubeAtLucky, cubeAtDiscount, trekAtFahrradXXL, trekAtLucky, uniqueBike];
  const groups = groupBikes(bikes, { enableFuzzy: false });

  it("creates one group per distinct canonical model", () => {
    expect(groups.length).toBe(3);
  });

  it("Cube group has 3 listings from 3 dealers", () => {
    const cube = groups.find((g) => g.brand === "Cube");
    expect(cube).toBeDefined();
    expect(cube!.listings.length).toBe(3);
    expect(cube!.dealerCount).toBe(3);
  });

  it("Trek group has 2 listings from 2 dealers", () => {
    const trek = groups.find((g) => g.brand === "Trek");
    expect(trek).toBeDefined();
    expect(trek!.listings.length).toBe(2);
    expect(trek!.dealerCount).toBe(2);
  });

  it("Kalkhoff group has 1 listing from 1 dealer", () => {
    const kalkhoff = groups.find((g) => g.brand === "Kalkhoff");
    expect(kalkhoff).toBeDefined();
    expect(kalkhoff!.listings.length).toBe(1);
    expect(kalkhoff!.dealerCount).toBe(1);
  });

  it("Cube bestPrice is the lowest across all dealers", () => {
    const cube = groups.find((g) => g.brand === "Cube")!;
    expect(cube.bestPrice).toBe(2799);
  });

  it("Cube highestPrice is the highest across all dealers", () => {
    const cube = groups.find((g) => g.brand === "Cube")!;
    expect(cube.highestPrice).toBe(3099);
  });

  it("marks cheapest listing as isBestOffer", () => {
    const cube = groups.find((g) => g.brand === "Cube")!;
    const best = cube.listings.find((l) => l.isBestOffer);
    expect(best).toBeDefined();
    expect(best!.price).toBe(2799);
    expect(best!.dealer).toBe("Fahrrad XXL");
  });

  it("listings are sorted cheapest first", () => {
    const cube = groups.find((g) => g.brand === "Cube")!;
    const prices = cube.listings.map((l) => l.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("multi-dealer groups appear before single-dealer groups", () => {
    expect(groups[0].dealerCount).toBeGreaterThan(1);
    expect(groups[groups.length - 1].dealerCount).toBe(1);
  });

  it("confidence is exact when all keys match exactly", () => {
    const cube = groups.find((g) => g.brand === "Cube")!;
    expect(cube.confidence).toBe("exact");
  });
});

// ---------------------------------------------------------------------------
// groupBikes — empty and single-bike inputs
// ---------------------------------------------------------------------------

describe("groupBikes — edge cases", () => {
  it("returns empty array for empty input", () => {
    expect(groupBikes([])).toEqual([]);
  });

  it("returns one group for a single bike", () => {
    const groups = groupBikes([uniqueBike]);
    expect(groups.length).toBe(1);
    expect(groups[0].listings.length).toBe(1);
    expect(groups[0].listings[0].isBestOffer).toBe(true);
    expect(groups[0].listings[0].savings).toBeNull();
  });

  it("single-listing group has null savings", () => {
    const groups = groupBikes([uniqueBike]);
    expect(groups[0].listings[0].savings).toBeNull();
  });

  it("two identical listings from same dealer stay in one group", () => {
    const dup = { ...cubeAtFahrradXXL };
    const groups = groupBikes([cubeAtFahrradXXL, dup], { enableFuzzy: false });
    expect(groups.length).toBe(1);
    expect(groups[0].listings.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// groupBikes — fuzzy matching
// ---------------------------------------------------------------------------

describe("groupBikes — fuzzy matching", () => {
  const bikes = [cubeAtFahrradXXL, cubeFuzzy];

  it("merges near-identical model names when enableFuzzy=true", () => {
    const groups = groupBikes(bikes, { enableFuzzy: true, fuzzyTolerance: 2 });
    // "cube:touring-hybrid-one-625" vs "cube:touring-hybrid-one625"
    // differ by 1 char (missing hyphen) → distance 1 → should merge
    expect(groups.length).toBe(1);
    expect(groups[0].listings.length).toBe(2);
    expect(groups[0].confidence).toBe("fuzzy");
  });

  it("does NOT merge when enableFuzzy=false", () => {
    const groups = groupBikes(bikes, { enableFuzzy: false });
    expect(groups.length).toBe(2);
    expect(groups[0].confidence).toBe("exact");
  });

  it("does NOT merge distant names even with fuzzy enabled", () => {
    const completely_different = makeBike({
      name: "Specialized Turbo Vado SL 5.0",
      brand: "Specialized",
      dealer: "Some Shop",
      price: 4999,
    });
    const groups = groupBikes([cubeAtFahrradXXL, completely_different], {
      enableFuzzy: true,
      fuzzyTolerance: 2,
    });
    expect(groups.length).toBe(2);
  });

  it("respects custom fuzzyTolerance=0 (no fuzzy at all)", () => {
    const groups = groupBikes(bikes, { enableFuzzy: true, fuzzyTolerance: 0 });
    expect(groups.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// getMultiDealerGroups
// ---------------------------------------------------------------------------

describe("getMultiDealerGroups", () => {
  const bikes = [cubeAtFahrradXXL, cubeAtLucky, uniqueBike];
  const groups = groupBikes(bikes, { enableFuzzy: false });

  it("returns only groups with more than 1 dealer", () => {
    const multi = getMultiDealerGroups(groups);
    expect(multi.every((g) => g.dealerCount > 1)).toBe(true);
  });

  it("excludes single-dealer groups", () => {
    const multi = getMultiDealerGroups(groups);
    const hasKalkhoff = multi.some((g) => g.brand === "Kalkhoff");
    expect(hasKalkhoff).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// summarizeResolution
// ---------------------------------------------------------------------------

describe("summarizeResolution", () => {
  const bikes = [cubeAtFahrradXXL, cubeAtLucky, cubeAtDiscount, uniqueBike];
  const groups = groupBikes(bikes, { enableFuzzy: false });

  it("counts total groups correctly", () => {
    const summary = summarizeResolution(groups);
    expect(summary.totalGroups).toBe(2);
  });

  it("counts multi-dealer groups correctly", () => {
    const summary = summarizeResolution(groups);
    expect(summary.multiDealerGroups).toBe(1);
  });

  it("counts total listings correctly", () => {
    const summary = summarizeResolution(groups);
    expect(summary.totalListings).toBe(4);
  });

  it("calculates maxSavings from multi-dealer groups", () => {
    const summary = summarizeResolution(groups);
    // Cube: highest 3099 - lowest 2799 = 300
    expect(summary.maxSavings).toBe(300);
  });

  it("maxSavings is null when no multi-dealer groups exist", () => {
    const solo = groupBikes([uniqueBike], { enableFuzzy: false });
    const summary = summarizeResolution(solo);
    expect(summary.maxSavings).toBeNull();
  });
});
