import { describe, it, expect } from "vitest";
import { filterAndSortBikes, type FilterValues } from "./bike-filters";
import type { Bike, BikeCategory } from "@/adapters/types";

const bikes: Bike[] = [
  {
    name: "Cube Touring Hybrid", brand: "Cube", category: "E-Bike", price: 2799, listPrice: 3099,
    dealer: "Fahrrad XXL", dealerUrl: "https://example.com/1", availability: "Auf Lager",
    frameSize: "M", wheelSize: "28\"", driveType: "chain", batteryWh: 625,
    motor: "Bosch Performance Line", suspension: "rigid", frameMaterial: "Aluminium", modelYear: 2024,
  },
  {
    name: "Canyon Roadlite CF 7", brand: "Canyon", category: "Rennrad", price: 1899,
    dealer: "Canyon Direct", dealerUrl: "https://example.com/2", availability: "Auf Lager",
    frameSize: "L", wheelSize: "700c", driveType: "chain", gearCount: 22,
    suspension: "rigid", frameMaterial: "Carbon", modelYear: 2024,
  },
  {
    name: "Bergamont Revox 3", brand: "Bergamont", category: "Mountainbike", price: 799, listPrice: 799,
    dealer: "Lucky Bike", dealerUrl: "https://example.com/3",
    frameSize: "S", wheelSize: "29\"", driveType: "chain", gearCount: 21,
    suspension: "hardtail", frameMaterial: "Aluminium", modelYear: 2023,
  },
  {
    name: "Specialized Diverge E5", brand: "Specialized", category: "Gravel", price: 1499, listPrice: 1799,
    dealer: "Fahrrad XXL", dealerUrl: "https://example.com/4", availability: "Bald verfügbar",
    frameSize: "M", wheelSize: "700c", driveType: "chain",
    suspension: "front", frameMaterial: "Aluminium", modelYear: 2025,
  },
  {
    name: "Puky Cyke 20-3", brand: "Puky", category: "Kinder", price: 399,
    dealer: "Lucky Bike", dealerUrl: "https://example.com/5",
    frameSize: "XS", wheelSize: "20\"", driveType: "chain", gearCount: 3,
    suspension: "rigid", frameMaterial: "Stahl",
  },
  {
    name: "Riese & Müller Load 75", brand: "Riese & Müller", category: "Cargo", price: 5999,
    dealer: "Fahrrad XXL", dealerUrl: "https://example.com/6",
    frameSize: "M", wheelSize: "20\"", driveType: "belt", batteryWh: 750,
    motor: "Bosch Cargo Line", suspension: "front", frameMaterial: "Aluminium", modelYear: 2025,
  },
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
  frameSizes: [],
  wheelSizes: [],
  driveTypes: [],
  suspensions: [],
  batteryWhMin: "",
  batteryWhMax: "",
  frameMaterials: [],
  modelYears: [],
  sortBy: "price-asc",
};

describe("filterAndSortBikes", () => {
  describe("search", () => {
    it("returns all bikes with empty search", () => {
      const result = filterAndSortBikes(bikes, emptyFilters);
      expect(result).toHaveLength(6);
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
      expect(result).toHaveLength(6);
    });
  });

  describe("price filter", () => {
    it("filters by minimum price", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, priceMin: "1500" });
      expect(result).toHaveLength(3); // 2799, 1899, 5999
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
      expect(result).toHaveLength(6);
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
      expect(result).toHaveLength(6);
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
      expect(result).toHaveLength(6);
    });
  });

  describe("sorting", () => {
    it("sorts by price ascending", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, sortBy: "price-asc" });
      expect(result[0].price).toBe(399);
      expect(result[result.length - 1].price).toBe(5999);
    });

    it("sorts by price descending", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, sortBy: "price-desc" });
      expect(result[0].price).toBe(5999);
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
      // Fahrrad XXL has Cube (discounted) and Specialized (discounted), R&M has no listPrice
      expect(result).toHaveLength(2);
      expect(result.every((b) => b.dealer === "Fahrrad XXL")).toBe(true);
    });
  });

  // ── Technical filter tests ───────────────────────────────────────────────

  describe("frameSize filter", () => {
    it("filters by single frame size", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, frameSizes: ["M"] });
      // Cube (M), Specialized (M), Riese & Müller (M)
      expect(result).toHaveLength(3);
      expect(result.every((b) => b.frameSize === "M")).toBe(true);
    });

    it("filters by multiple frame sizes", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, frameSizes: ["M", "L"] });
      expect(result).toHaveLength(4); // Cube, Canyon, Specialized, R&M
    });

    it("returns no bikes when size not present in data", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, frameSizes: ["XXL"] });
      expect(result).toHaveLength(0);
    });

    it("returns all bikes when frameSizes is empty", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, frameSizes: [] });
      expect(result).toHaveLength(6);
    });
  });

  describe("wheelSize filter", () => {
    it("filters by wheel size", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, wheelSizes: ["29\""] });
      expect(result).toHaveLength(1);
      expect(result[0].brand).toBe("Bergamont");
    });

    it("filters by multiple wheel sizes", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, wheelSizes: ["700c", "29\""] });
      // Canyon (700c), Specialized (700c), Bergamont (29")
      expect(result).toHaveLength(3);
    });
  });

  describe("driveType filter", () => {
    it("filters belt-drive bikes", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, driveTypes: ["belt"] });
      expect(result).toHaveLength(1);
      expect(result[0].brand).toBe("Riese & Müller");
    });

    it("filters chain-drive bikes", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, driveTypes: ["chain"] });
      expect(result).toHaveLength(5);
    });

    it("filters multiple drive types", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, driveTypes: ["chain", "belt"] });
      expect(result).toHaveLength(6);
    });

    it("returns nothing for shaft which is not in the data", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, driveTypes: ["shaft"] });
      expect(result).toHaveLength(0);
    });
  });

  describe("suspension filter", () => {
    it("filters fully-suspended bikes", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, suspensions: ["fully"] });
      expect(result).toHaveLength(0);
    });

    it("filters hardtail bikes", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, suspensions: ["hardtail"] });
      expect(result).toHaveLength(1);
      expect(result[0].brand).toBe("Bergamont");
    });

    it("filters rigid and hardtail together", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, suspensions: ["rigid", "hardtail"] });
      // Cube (rigid), Canyon (rigid), Bergamont (hardtail), Puky (rigid)
      expect(result).toHaveLength(4);
    });
  });

  describe("batteryWh filter", () => {
    it("filters by minimum battery capacity", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, batteryWhMin: "700" });
      expect(result).toHaveLength(1);
      expect(result[0].brand).toBe("Riese & Müller"); // 750 Wh
    });

    it("filters by maximum battery capacity", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, batteryWhMax: "650" });
      expect(result).toHaveLength(1);
      expect(result[0].brand).toBe("Cube"); // 625 Wh
    });

    it("filters by battery range", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, batteryWhMin: "600", batteryWhMax: "700" });
      expect(result).toHaveLength(1);
      expect(result[0].batteryWh).toBe(625);
    });

    it("excludes bikes without batteryWh when min is set", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, batteryWhMin: "1" });
      // Only E-Bikes with batteryWh defined: Cube (625) and R&M (750)
      expect(result).toHaveLength(2);
    });
  });

  describe("frameMaterial filter", () => {
    it("filters carbon bikes", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, frameMaterials: ["Carbon"] });
      expect(result).toHaveLength(1);
      expect(result[0].brand).toBe("Canyon");
    });

    it("filters aluminium bikes", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, frameMaterials: ["Aluminium"] });
      expect(result).toHaveLength(4); // Cube, Bergamont, Specialized, R&M
    });

    it("filters multiple materials", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, frameMaterials: ["Carbon", "Stahl"] });
      expect(result).toHaveLength(2); // Canyon, Puky
    });
  });

  describe("modelYear filter", () => {
    it("filters by single year", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, modelYears: ["2024"] });
      // Cube (2024), Canyon (2024)
      expect(result).toHaveLength(2);
    });

    it("filters by multiple years", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, modelYears: ["2024", "2025"] });
      // Cube (2024), Canyon (2024), Specialized (2025), R&M (2025)
      expect(result).toHaveLength(4);
    });

    it("excludes bikes without modelYear when filter is set", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, modelYears: ["2023"] });
      expect(result).toHaveLength(1);
      expect(result[0].brand).toBe("Bergamont");
    });
  });

  describe("sorting — new options", () => {
    it("sorts by battery-desc: highest Wh first, bikes without battery at end", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, sortBy: "battery-desc" });
      // R&M (750), Cube (625) first; rest have no batteryWh → sorted as 0
      expect(result[0].batteryWh).toBe(750);
      expect(result[1].batteryWh).toBe(625);
    });

    it("sorts by year-desc: newest model year first", () => {
      const result = filterAndSortBikes(bikes, { ...emptyFilters, sortBy: "year-desc" });
      // 2025 first (Specialized or R&M), then 2024, then 2023
      expect(result[0].modelYear).toBe(2025);
      expect(result[result.length - 1].modelYear).toBeUndefined(); // Puky has no modelYear
    });
  });
});
