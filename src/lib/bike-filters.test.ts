import { describe, it, expect } from "vitest";
import { filterAndSortBikes, type FilterValues } from "./bike-filters";
import type { Bike, BikeCategory } from "@/adapters/types";

const bikes: Bike[] = [
  { name: "Cube Touring Hybrid", brand: "Cube", category: "E-Bike", price: 2799, dealer: "Fahrrad XXL", dealerUrl: "https://example.com/1" },
  { name: "Canyon Roadlite CF 7", brand: "Canyon", category: "Rennrad", price: 1899, dealer: "Canyon Direct", dealerUrl: "https://example.com/2" },
  { name: "Bergamont Revox 3", brand: "Bergamont", category: "Mountainbike", price: 799, dealer: "Lucky Bike", dealerUrl: "https://example.com/3" },
  { name: "Specialized Diverge E5", brand: "Specialized", category: "Gravel", price: 1499, dealer: "Fahrrad XXL", dealerUrl: "https://example.com/4" },
  { name: "Puky Cyke 20-3", brand: "Puky", category: "Kinder", price: 399, dealer: "Lucky Bike", dealerUrl: "https://example.com/5" },
];

const emptyFilters: FilterValues = {
  search: "",
  categories: [] as BikeCategory[],
  priceMin: "",
  priceMax: "",
  dealer: "",
  brand: "",
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

  describe("dealer filter", () => {
    it("filters by dealer", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, dealer: "Lucky Bike" });
      expect(result).toHaveLength(2);
      expect(result.every((b) => b.dealer === "Lucky Bike")).toBe(true);
    });
  });

  describe("brand filter", () => {
    it("filters by brand", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, brand: "Cube" });
      expect(result).toHaveLength(1);
      expect(result[0].brand).toBe("Cube");
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
  });
});
