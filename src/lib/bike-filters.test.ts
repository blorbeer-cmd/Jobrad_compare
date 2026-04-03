import { describe, it, expect } from "vitest";
import { filterAndSortBikes, type FilterValues } from "./bike-filters";
import type { Bike, BikeCategory } from "@/adapters/types";

const bikes: Bike[] = [
  { name: "Cube Touring Hybrid", brand: "Cube", category: "E-Bike", price: 2799, listPrice: 3099, dealer: "Fahrrad XXL", dealerUrl: "https://example.com/1", availability: "Auf Lager" },
  { name: "Canyon Roadlite CF 7", brand: "Canyon", category: "Rennrad", price: 1899, dealer: "Canyon Direct", dealerUrl: "https://example.com/2", availability: "Auf Lager" },
  { name: "Bergamont Revox 3", brand: "Bergamont", category: "Mountainbike", price: 799, listPrice: 799, dealer: "Lucky Bike", dealerUrl: "https://example.com/3" },
  { name: "Specialized Diverge E5", brand: "Specialized", category: "Gravel", price: 1499, listPrice: 1799, dealer: "Fahrrad XXL", dealerUrl: "https://example.com/4", availability: "Bald verfügbar" },
  { name: "Puky Cyke 20-3", brand: "Puky", category: "Kinder", price: 399, dealer: "Lucky Bike", dealerUrl: "https://example.com/5" },
];

const emptyFilters: FilterValues = {
  search: "",
  categories: [] as BikeCategory[],
  priceMin: "",
  priceMax: "",
  dealer: "",
  dealers: [],
  brand: "",
  brands: [],
  onlyDiscounted: false,
  availability: "",
  sortBy: "price-asc",
};

describe("filterAndSortBikes", () => {
  describe("search", () => {
    it("returns all bikes with empty search", () => {
      const result = filterAndSortBikes(bikes, emptyFilters);
      expect(result).toHaveLength(5);
    });

    it("filters by bike name", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, search: "cube" });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Cube Touring Hybrid");
    });

    it("filters by brand name", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, search: "specialized" });
      expect(result).toHaveLength(1);
      expect(result[0].brand).toBe("Specialized");
    });

    it("filters by dealer name", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, search: "lucky" });
      expect(result).toHaveLength(2);
      expect(result.every((b) => b.dealer === "Lucky Bike")).toBe(true);
    });

    it("search is case-insensitive", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, search: "CANYON" });
      expect(result).toHaveLength(1);
    });

    it("returns empty when nothing matches", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, search: "nonexistent" });
      expect(result).toHaveLength(0);
    });
  });

  describe("category filter", () => {
    it("filters by single category", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, categories: ["E-Bike" as BikeCategory] });
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe("E-Bike");
    });

    it("filters by multiple categories", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, categories: ["E-Bike", "Rennrad"] as BikeCategory[] });
      expect(result).toHaveLength(2);
    });

    it("returns all bikes with no category filter", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, categories: [] });
      expect(result).toHaveLength(5);
    });
  });

  describe("price filter", () => {
    it("filters by minimum price", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, priceMin: "1500" });
      expect(result).toHaveLength(2); // 2799 and 1899
    });

    it("filters by maximum price", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, priceMax: "1000" });
      expect(result).toHaveLength(2); // 799 and 399
    });

    it("filters by price range", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, priceMin: "1000", priceMax: "2000" });
      expect(result).toHaveLength(2); // 1899 and 1499
    });
  });

  describe("dealer filter (legacy single)", () => {
    it("filters by dealer", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, dealer: "Lucky Bike" });
      expect(result).toHaveLength(2);
      expect(result.every((b) => b.dealer === "Lucky Bike")).toBe(true);
    });
  });

  describe("dealers filter (multi-select)", () => {
    it("filters by a single dealer in dealers[]", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, dealers: ["Lucky Bike"] });
      expect(result).toHaveLength(2);
      expect(result.every((b) => b.dealer === "Lucky Bike")).toBe(true);
    });

    it("filters by multiple dealers", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, dealers: ["Lucky Bike", "Canyon Direct"] });
      expect(result).toHaveLength(3);
    });

    it("dealers[] takes precedence over legacy dealer when both set", () => {
      // dealers[] = [Lucky Bike], dealer = "Canyon Direct" → Lucky Bike wins
      const result = filterAndSortBikes(bikes, { ...emptyFilters, dealers: ["Lucky Bike"], dealer: "Canyon Direct" });
      expect(result).toHaveLength(2);
      expect(result.every((b) => b.dealer === "Lucky Bike")).toBe(true);
    });
  });

  describe("brand filter (legacy single)", () => {
    it("filters by brand", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, brand: "Cube" });
      expect(result).toHaveLength(1);
      expect(result[0].brand).toBe("Cube");
    });
  });

  describe("brands filter (multi-select)", () => {
    it("filters by a single brand in brands[]", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, brands: ["Cube"] });
      expect(result).toHaveLength(1);
    });

    it("filters by multiple brands", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, brands: ["Cube", "Canyon"] });
      expect(result).toHaveLength(2);
    });

    it("brands[] takes precedence over legacy brand when both set", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, brands: ["Cube"], brand: "Canyon" });
      expect(result).toHaveLength(1);
      expect(result[0].brand).toBe("Cube");
    });

    it("returns all bikes when brands[] is empty", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, brands: [] });
      expect(result).toHaveLength(5);
    });
  });

  describe("onlyDiscounted filter", () => {
    it("returns only bikes where listPrice > price", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, onlyDiscounted: true });
      // Cube: listPrice 3099 > price 2799 ✓
      // Specialized: listPrice 1799 > price 1499 ✓
      // Bergamont: listPrice 799 = price 799 ✗ (not discounted)
      // Canyon: no listPrice ✗
      // Puky: no listPrice ✗
      expect(result).toHaveLength(2);
      expect(result.map((b) => b.brand).sort()).toEqual(["Cube", "Specialized"]);
    });

    it("returns all bikes when onlyDiscounted=false", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, onlyDiscounted: false });
      expect(result).toHaveLength(5);
    });
  });

  describe("availability filter", () => {
    it("filters by availability string", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, availability: "Auf Lager" });
      expect(result).toHaveLength(2);
      expect(result.every((b) => b.availability === "Auf Lager")).toBe(true);
    });

    it("returns empty when availability doesn't match any bike", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, availability: "Ausverkauft" });
      expect(result).toHaveLength(0);
    });

    it("returns all bikes when availability is empty string", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, availability: "" });
      expect(result).toHaveLength(5);
    });
  });

  describe("sorting", () => {
    it("sorts by price ascending", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, sortBy: "price-asc" });
      expect(result[0].price).toBe(399);
      expect(result[result.length - 1].price).toBe(2799);
    });

    it("sorts by price descending", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, sortBy: "price-desc" });
      expect(result[0].price).toBe(2799);
      expect(result[result.length - 1].price).toBe(399);
    });

    it("sorts by name A-Z", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, sortBy: "name-asc" });
      expect(result[0].name).toBe("Bergamont Revox 3");
    });

    it("sorts by name Z-A", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, sortBy: "name-desc" });
      expect(result[0].name).toBe("Specialized Diverge E5");
    });

    it("sorts by discount-desc: biggest discount percentage first", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, sortBy: "discount-desc" });
      // Cube: (3099-2799)/3099 ≈ 9.7%
      // Specialized: (1799-1499)/1799 ≈ 16.7%
      // → Specialized should come first among discounted
      const discounted = result.filter((b) => b.listPrice && b.listPrice > b.price);
      expect(discounted[0].brand).toBe("Specialized");
      expect(discounted[1].brand).toBe("Cube");
    });

    it("sorts by discount-abs-desc: biggest absolute saving first", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, sortBy: "discount-abs-desc" });
      // Cube: 3099-2799 = 300 €
      // Specialized: 1799-1499 = 300 €
      // Both equal — just check both are before non-discounted
      const discounted = result.filter((b) => b.listPrice && b.listPrice > b.price);
      expect(discounted.length).toBe(2);
      // non-discounted bikes should be at end (savings = -1 in sort)
      expect(result[result.length - 1].listPrice).toBeUndefined();
    });

    it("places non-discounted bikes at end when sorting by discount", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, sortBy: "discount-desc" });
      // Cube and Specialized are discounted → come first
      // Canyon, Bergamont (listPrice=price, no saving), Puky → at end
      const firstTwo = result.slice(0, 2).map((b) => b.brand).sort();
      expect(firstTwo).toEqual(["Cube", "Specialized"]);
    });
  });

  describe("combined filters", () => {
    it("applies search + category + price together", () => {
      const result = filterAndSortBikes(bikes, {
        ...emptyFilters,
        categories: ["E-Bike", "Rennrad", "Gravel"] as BikeCategory[],
        priceMin: "1000",
        priceMax: "2000",
      });
      // Should match: Canyon (1899, Rennrad) and Specialized (1499, Gravel)
      expect(result).toHaveLength(2);
    });

    it("applies onlyDiscounted + dealer multi-select", () => {
      const result = filterAndSortBikes(bikes, {
        ...emptyFilters,
        dealers: ["Fahrrad XXL"],
        onlyDiscounted: true,
      });
      // Fahrrad XXL has Cube (discounted) and Specialized (discounted)
      expect(result).toHaveLength(2);
      expect(result.every((b) => b.dealer === "Fahrrad XXL")).toBe(true);
    });
  });
});
