import { describe, it, expect } from "vitest";
import { BikeSchema, BikeCategory } from "./types";

describe("BikeSchema", () => {
  const validBike = {
    name: "Cube Touring Hybrid ONE 625",
    brand: "Cube",
    category: "E-Bike" as const,
    price: 2799,
    dealer: "Fahrrad XXL",
    dealerUrl: "https://www.fahrrad-xxl.de/cube-touring",
    imageUrl: "https://placehold.co/400x300",
    availability: "Sofort verfuegbar",
  };

  it("accepts a valid bike", () => {
    const result = BikeSchema.safeParse(validBike);
    expect(result.success).toBe(true);
  });

  it("accepts a bike without optional fields", () => {
    const { imageUrl, availability, ...minimal } = validBike;
    const result = BikeSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it("rejects a bike with empty name", () => {
    const result = BikeSchema.safeParse({ ...validBike, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a bike with negative price", () => {
    const result = BikeSchema.safeParse({ ...validBike, price: -100 });
    expect(result.success).toBe(false);
  });

  it("rejects a bike with zero price", () => {
    const result = BikeSchema.safeParse({ ...validBike, price: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects a bike with invalid category", () => {
    const result = BikeSchema.safeParse({ ...validBike, category: "Einrad" });
    expect(result.success).toBe(false);
  });

  it("rejects a bike with invalid dealerUrl", () => {
    const result = BikeSchema.safeParse({ ...validBike, dealerUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects a bike with missing required fields", () => {
    const result = BikeSchema.safeParse({ name: "Test" });
    expect(result.success).toBe(false);
  });
});

describe("BikeCategory", () => {
  const validCategories = [
    "E-Bike", "City", "Trekking", "Mountainbike",
    "Rennrad", "Cargo", "Gravel", "Kinder", "Sonstige",
  ];

  it.each(validCategories)("accepts '%s' as valid category", (cat) => {
    const result = BikeCategory.safeParse(cat);
    expect(result.success).toBe(true);
  });

  it("rejects an invalid category", () => {
    const result = BikeCategory.safeParse("Dreirad");
    expect(result.success).toBe(false);
  });
});
