import { describe, it, expect } from "vitest";
import {
  compareOffers,
  getCurrentOfferForShop,
  getCurrentOffersPerShop,
  isOfferValid,
  type Offer,
  type Shop,
} from "./comparison";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const REFERENCE_DATE = new Date("2026-03-24T12:00:00Z");

const SHOPS: Shop[] = [
  { id: "shop_a", name: "Bike Store A", location: "Berlin" },
  { id: "shop_b", name: "Bike Store B", location: "München" },
  { id: "shop_c", name: "Bike Store C", location: "Hamburg" },
];

function makeOffer(
  id: string,
  shopId: string,
  price: number,
  monthlyRate: number,
  overrides: Partial<Offer> = {}
): Offer {
  return {
    id,
    shopId,
    bikeModel: "Trekking 500",
    bikeBrand: "Cube",
    price,
    monthlyRate,
    createdAt: new Date("2026-03-01T10:00:00Z"),
    validFrom: new Date("2026-01-01T00:00:00Z"),
    validUntil: null,
    isActive: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// isOfferValid
// ---------------------------------------------------------------------------

describe("isOfferValid", () => {
  it("returns true for a normal active offer", () => {
    const offer = makeOffer("o1", "shop_a", 3000, 80);
    expect(isOfferValid(offer, REFERENCE_DATE)).toBe(true);
  });

  it("returns false when isActive is false", () => {
    const offer = makeOffer("o1", "shop_a", 3000, 80, { isActive: false });
    expect(isOfferValid(offer, REFERENCE_DATE)).toBe(false);
  });

  it("returns false when validFrom is in the future", () => {
    const offer = makeOffer("o1", "shop_a", 3000, 80, {
      validFrom: new Date("2026-04-01T00:00:00Z"),
    });
    expect(isOfferValid(offer, REFERENCE_DATE)).toBe(false);
  });

  it("returns false when validUntil is in the past", () => {
    const offer = makeOffer("o1", "shop_a", 3000, 80, {
      validUntil: new Date("2026-03-01T00:00:00Z"),
    });
    expect(isOfferValid(offer, REFERENCE_DATE)).toBe(false);
  });

  it("returns true when offer has no validUntil (open-ended)", () => {
    const offer = makeOffer("o1", "shop_a", 3000, 80, { validUntil: null });
    expect(isOfferValid(offer, REFERENCE_DATE)).toBe(true);
  });

  it("returns true on exact validFrom boundary date", () => {
    const offer = makeOffer("o1", "shop_a", 3000, 80, {
      validFrom: REFERENCE_DATE,
    });
    expect(isOfferValid(offer, REFERENCE_DATE)).toBe(true);
  });

  it("returns true on exact validUntil boundary date", () => {
    const offer = makeOffer("o1", "shop_a", 3000, 80, {
      validUntil: REFERENCE_DATE,
    });
    expect(isOfferValid(offer, REFERENCE_DATE)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getCurrentOfferForShop
// ---------------------------------------------------------------------------

describe("getCurrentOfferForShop", () => {
  it("returns the single valid offer", () => {
    const offers = [makeOffer("o1", "shop_a", 3000, 80)];
    const result = getCurrentOfferForShop(offers, "shop_a", REFERENCE_DATE);
    expect(result?.id).toBe("o1");
  });

  it("returns null when no offers exist", () => {
    const result = getCurrentOfferForShop([], "shop_a", REFERENCE_DATE);
    expect(result).toBeNull();
  });

  it("returns null when offers belong to a different shop", () => {
    const offers = [makeOffer("o1", "shop_b", 3000, 80)];
    const result = getCurrentOfferForShop(offers, "shop_a", REFERENCE_DATE);
    expect(result).toBeNull();
  });

  it("returns the most recently created offer when multiple valid offers exist", () => {
    const offers = [
      makeOffer("old", "shop_a", 3000, 90, {
        createdAt: new Date("2026-02-01T10:00:00Z"),
      }),
      makeOffer("new", "shop_a", 3100, 85, {
        createdAt: new Date("2026-03-15T10:00:00Z"),
      }),
    ];
    const result = getCurrentOfferForShop(offers, "shop_a", REFERENCE_DATE);
    expect(result?.id).toBe("new");
  });

  it("excludes expired offers", () => {
    const offers = [
      makeOffer("expired", "shop_a", 3000, 80, {
        validUntil: new Date("2026-03-01T00:00:00Z"),
      }),
    ];
    const result = getCurrentOfferForShop(offers, "shop_a", REFERENCE_DATE);
    expect(result).toBeNull();
  });

  it("excludes future offers", () => {
    const offers = [
      makeOffer("future", "shop_a", 3000, 80, {
        validFrom: new Date("2026-04-01T00:00:00Z"),
      }),
    ];
    const result = getCurrentOfferForShop(offers, "shop_a", REFERENCE_DATE);
    expect(result).toBeNull();
  });

  it("excludes inactive offers", () => {
    const offers = [makeOffer("inactive", "shop_a", 3000, 80, { isActive: false })];
    const result = getCurrentOfferForShop(offers, "shop_a", REFERENCE_DATE);
    expect(result).toBeNull();
  });

  it("falls back to older valid offer when newest is expired", () => {
    const offers = [
      makeOffer("older_valid", "shop_a", 3000, 90, {
        createdAt: new Date("2026-02-01T00:00:00Z"),
      }),
      makeOffer("newer_expired", "shop_a", 2800, 75, {
        createdAt: new Date("2026-03-10T00:00:00Z"),
        validUntil: new Date("2026-03-20T00:00:00Z"),
      }),
    ];
    const result = getCurrentOfferForShop(offers, "shop_a", REFERENCE_DATE);
    expect(result?.id).toBe("older_valid");
  });

  it("falls back to older valid offer when newest is inactive", () => {
    const offers = [
      makeOffer("older_valid", "shop_a", 3000, 90, {
        createdAt: new Date("2026-02-01T00:00:00Z"),
      }),
      makeOffer("newer_inactive", "shop_a", 2800, 75, {
        createdAt: new Date("2026-03-10T00:00:00Z"),
        isActive: false,
      }),
    ];
    const result = getCurrentOfferForShop(offers, "shop_a", REFERENCE_DATE);
    expect(result?.id).toBe("older_valid");
  });
});

// ---------------------------------------------------------------------------
// getCurrentOffersPerShop
// ---------------------------------------------------------------------------

describe("getCurrentOffersPerShop", () => {
  it("returns one entry per shop that has a valid offer", () => {
    const offers = [
      makeOffer("a1", "shop_a", 3000, 80, { createdAt: new Date("2026-02-01T00:00:00Z") }),
      makeOffer("a2", "shop_a", 3100, 85, { createdAt: new Date("2026-03-01T00:00:00Z") }),
      makeOffer("b1", "shop_b", 2900, 78),
    ];
    const result = getCurrentOffersPerShop(offers, SHOPS, REFERENCE_DATE);
    expect(result.has("shop_a")).toBe(true);
    expect(result.has("shop_b")).toBe(true);
    expect(result.has("shop_c")).toBe(false); // no offers
    expect(result.get("shop_a")?.id).toBe("a2"); // newer offer
    expect(result.get("shop_b")?.id).toBe("b1");
  });

  it("excludes shops with only expired or inactive offers", () => {
    const offers = [
      makeOffer("expired", "shop_a", 3000, 80, {
        validUntil: new Date("2026-02-01T00:00:00Z"),
      }),
      makeOffer("inactive", "shop_b", 2900, 78, { isActive: false }),
      makeOffer("valid", "shop_c", 3200, 90),
    ];
    const result = getCurrentOffersPerShop(offers, SHOPS, REFERENCE_DATE);
    expect(result.has("shop_a")).toBe(false);
    expect(result.has("shop_b")).toBe(false);
    expect(result.has("shop_c")).toBe(true);
  });

  it("each shop independently selects its own latest offer", () => {
    const offers = [
      makeOffer("a_old", "shop_a", 3000, 90, { createdAt: new Date("2026-01-15T00:00:00Z") }),
      makeOffer("a_new", "shop_a", 3100, 82, { createdAt: new Date("2026-03-20T00:00:00Z") }),
      makeOffer("b_old", "shop_b", 2800, 75, { createdAt: new Date("2026-01-10T00:00:00Z") }),
      makeOffer("b_new", "shop_b", 2900, 77, { createdAt: new Date("2026-03-18T00:00:00Z") }),
    ];
    const result = getCurrentOffersPerShop(offers, SHOPS, REFERENCE_DATE);
    expect(result.get("shop_a")?.id).toBe("a_new");
    expect(result.get("shop_b")?.id).toBe("b_new");
  });
});

// ---------------------------------------------------------------------------
// compareOffers
// ---------------------------------------------------------------------------

describe("compareOffers", () => {
  it("includes only current offers (not expired ones)", () => {
    const offers = [
      makeOffer("a_old_cheap", "shop_a", 2500, 65, {
        createdAt: new Date("2026-01-01T00:00:00Z"),
        validUntil: new Date("2026-02-28T00:00:00Z"),
      }),
      makeOffer("a_new", "shop_a", 3000, 80, {
        createdAt: new Date("2026-03-01T00:00:00Z"),
      }),
      makeOffer("b1", "shop_b", 2900, 78),
    ];
    const result = compareOffers(offers, SHOPS, "Trekking 500", "Cube", REFERENCE_DATE);
    const ids = result.offers.map((o) => o.id);
    expect(ids).not.toContain("a_old_cheap");
    expect(ids).toContain("a_new");
    expect(ids).toContain("b1");
    expect(result.offers.length).toBe(2);
  });

  it("identifies the cheapest offer by monthly rate", () => {
    const offers = [
      makeOffer("a1", "shop_a", 3000, 85),
      makeOffer("b1", "shop_b", 2800, 72),
      makeOffer("c1", "shop_c", 3200, 90),
    ];
    const result = compareOffers(offers, SHOPS, "Trekking 500", "Cube", REFERENCE_DATE);
    expect(result.cheapestOffer?.id).toBe("b1");
    expect(result.cheapestOffer?.monthlyRate).toBe(72);
  });

  it("filters by bike model and brand", () => {
    const offers = [
      makeOffer("a_cube", "shop_a", 3000, 80, {
        bikeModel: "Trekking 500",
        bikeBrand: "Cube",
      }),
      makeOffer("a_giant", "shop_a", 2800, 75, {
        bikeModel: "Escape 3",
        bikeBrand: "Giant",
      }),
    ];
    const result = compareOffers(offers, SHOPS, "Trekking 500", "Cube", REFERENCE_DATE);
    expect(result.offers.length).toBe(1);
    expect(result.offers[0].id).toBe("a_cube");
  });

  it("returns empty result when all offers are expired", () => {
    const offers = [
      makeOffer("a_exp", "shop_a", 3000, 80, {
        validUntil: new Date("2026-02-01T00:00:00Z"),
      }),
      makeOffer("b_exp", "shop_b", 2900, 78, {
        validUntil: new Date("2026-03-01T00:00:00Z"),
      }),
    ];
    const result = compareOffers(offers, SHOPS, "Trekking 500", "Cube", REFERENCE_DATE);
    expect(result.offers.length).toBe(0);
    expect(result.cheapestOffer).toBeNull();
  });

  it("does not use old offer when a newer one replaces it", () => {
    const offers = [
      makeOffer("a_jan", "shop_a", 2500, 60, {
        createdAt: new Date("2026-01-05T00:00:00Z"),
      }),
      makeOffer("a_mar", "shop_a", 3000, 85, {
        createdAt: new Date("2026-03-05T00:00:00Z"),
      }),
      makeOffer("b1", "shop_b", 2900, 78),
    ];
    const result = compareOffers(offers, SHOPS, "Trekking 500", "Cube", REFERENCE_DATE);
    const ids = result.offers.map((o) => o.id);
    expect(ids).not.toContain("a_jan");
    expect(ids).toContain("a_mar");
    expect(result.cheapestOffer?.id).toBe("b1");
  });

  it("reflects updated (lower) price in comparison", () => {
    const offers = [
      makeOffer("a_old", "shop_a", 3200, 95, {
        createdAt: new Date("2026-02-01T00:00:00Z"),
      }),
      makeOffer("a_new", "shop_a", 2800, 72, {
        createdAt: new Date("2026-03-20T00:00:00Z"),
      }),
      makeOffer("b1", "shop_b", 3000, 80),
    ];
    const result = compareOffers(offers, SHOPS, "Trekking 500", "Cube", REFERENCE_DATE);
    const shopAOffer = result.offers.find((o) => o.shopId === "shop_a");
    expect(shopAOffer?.monthlyRate).toBe(72);
    expect(shopAOffer?.id).toBe("a_new");
    expect(result.cheapestOffer?.id).toBe("a_new");
  });

  it("carries correct metadata in result", () => {
    const offers = [makeOffer("a1", "shop_a", 3000, 80)];
    const result = compareOffers(offers, SHOPS, "Trekking 500", "Cube", REFERENCE_DATE);
    expect(result.bikeModel).toBe("Trekking 500");
    expect(result.bikeBrand).toBe("Cube");
  });

  it("produces independent results for different bikes", () => {
    const offers = [
      makeOffer("a_cube", "shop_a", 3000, 80, {
        bikeModel: "Trekking 500",
        bikeBrand: "Cube",
      }),
      makeOffer("a_giant", "shop_a", 2500, 65, {
        bikeModel: "Escape 3",
        bikeBrand: "Giant",
      }),
    ];
    const resultCube = compareOffers(offers, SHOPS, "Trekking 500", "Cube", REFERENCE_DATE);
    const resultGiant = compareOffers(offers, SHOPS, "Escape 3", "Giant", REFERENCE_DATE);
    expect(resultCube.offers.length).toBe(1);
    expect(resultCube.offers[0].monthlyRate).toBe(80);
    expect(resultGiant.offers.length).toBe(1);
    expect(resultGiant.offers[0].monthlyRate).toBe(65);
  });
});
