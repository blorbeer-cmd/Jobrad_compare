import { describe, it, expect } from "vitest";
import { BaseAdapter } from "./base-adapter";
import type { Bike } from "./types";

// Concrete subclass for testing protected methods
class TestAdapter extends BaseAdapter {
  name = "Test";
  async fetchBikes(): Promise<Bike[]> {
    return [];
  }

  // Expose protected methods for testing
  public testMapCategory(raw: string) {
    return this.mapCategory(raw);
  }
  public testParsePrice(raw: string) {
    return this.parsePrice(raw);
  }
  public testExtractBrand(productName: string) {
    return this.extractBrand(productName);
  }
  public testInferDriveType(name: string) {
    return this.inferDriveType(name);
  }
}

describe("BaseAdapter.mapCategory", () => {
  const adapter = new TestAdapter();

  it.each([
    ["E-Bike", "E-Bike"],
    ["ebike", "E-Bike"],
    ["Elektrofahrrad", "E-Bike"],
    ["City Bike", "City"],
    ["Urban Commuter", "City"],
    ["Trekking Rad", "Trekking"],
    ["Touring Bike", "Trekking"],
    ["Mountainbike", "Mountainbike"],
    ["MTB Hardtail", "Mountainbike"],
    ["Rennrad", "Rennrad"],
    ["Road Bike", "Rennrad"],
    ["Race Bike", "Rennrad"],
    ["Cargo Bike", "Cargo"],
    ["Lastenrad", "Cargo"],
    ["Transportrad", "Cargo"],
    ["Gravel Bike", "Gravel"],
    ["Crossrad", "Gravel"],
    ["Cyclocross", "Gravel"],
    ["Kinderrad", "Kinder"],
    ["Jugendrad", "Kinder"],
    ["Kids Bike", "Kinder"],
    ["Tandem", "Sonstige"],
  ] as const)("maps '%s' to '%s'", (input, expected) => {
    expect(adapter.testMapCategory(input)).toBe(expected);
  });
});

describe("BaseAdapter.parsePrice", () => {
  const adapter = new TestAdapter();

  it.each([
    ["2.799,00 €", 2799],
    ["1.899,99€", 1899.99],
    ["399,00", 399],
    ["1499", 1499],
    ["ab 2.799,00 EUR", 2799],
    ["UVP: 3.499,99 €", 3499.99],
  ])("parses '%s' to %d", (input, expected) => {
    expect(adapter.testParsePrice(input)).toBeCloseTo(expected, 2);
  });

  it.each([
    ["kostenlos"],
    [""],
    ["abc"],
  ])("returns null for invalid price '%s'", (input) => {
    expect(adapter.testParsePrice(input)).toBeNull();
  });
});

describe("BaseAdapter.extractBrand", () => {
  const adapter = new TestAdapter();

  it.each([
    ["Cube Touring Hybrid ONE 625", "Cube"],
    ["Canyon Roadlite CF 7", "Canyon"],
    ["Kalkhoff Endeavour 5.B Move+", "Kalkhoff"],
    ["Specialized Diverge E5", "Specialized"],
    ["Giant Explore E+", "Giant"],
    ["Scott Scale 970", "Scott"],
    ["Trek Domane SL 5", "Trek"],
    ["Haibike AllMtn 6", "Haibike"],
    ["Puky Cyke 20-3", "Puky"],
  ])("extracts '%s' brand as '%s'", (input, expected) => {
    expect(adapter.testExtractBrand(input)).toBe(expected);
  });

  it("uses first word for unknown brands", () => {
    expect(adapter.testExtractBrand("Acme Speedster 3000")).toBe("Acme");
  });

  it("returns 'Unbekannt' for empty string", () => {
    expect(adapter.testExtractBrand("")).toBe("Unbekannt");
  });
});

describe("BaseAdapter.inferDriveType", () => {
  const adapter = new TestAdapter();

  it("detects belt drive from 'Riemen' in name", () => {
    expect(adapter.testInferDriveType("Riese & Müller Load 75 Riemen")).toBe("belt");
  });
  it("detects belt drive from 'Belt' in name", () => {
    expect(adapter.testInferDriveType("Diamant Achat Super Deluxe belt")).toBe("belt");
  });
  it("detects belt drive from 'Gates' in name", () => {
    expect(adapter.testInferDriveType("Kalkhoff Endeavour 5 Gates Edition")).toBe("belt");
  });
  it("detects shaft drive from 'Kardan' in name", () => {
    expect(adapter.testInferDriveType("Hercules Kazan Kardan")).toBe("shaft");
  });
  it("returns undefined for regular chain-drive bikes", () => {
    expect(adapter.testInferDriveType("Cube Touring Hybrid Pro")).toBeUndefined();
  });
  it("returns undefined when drive type is unrecognizable", () => {
    expect(adapter.testInferDriveType("Canyon Roadlite CF 7")).toBeUndefined();
  });
  it("is case-insensitive", () => {
    expect(adapter.testInferDriveType("Winora Yucatan 12 RIEMEN")).toBe("belt");
  });
});
