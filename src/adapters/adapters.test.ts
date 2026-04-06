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
import { BOCAdapter } from "./boc";
import { RoseBikesAdapter } from "./rose-bikes";
import { Bike24Adapter } from "./bike24";
import { HibikeAdapter } from "./hibike";
import { FahrradDeAdapter } from "./bruegelmann";
import { BikesterAdapter } from "./bikester";
import { SportBittlAdapter } from "./sport-bittl";
import { ZweiradStadlerAdapter } from "./zweirad-stadler";
import { CanyonAdapter } from "./canyon";
import { DecathlonAdapter } from "./decathlon";
import { SpecializedAdapter } from "./specialized";
import { SimplyBikeAdapter } from "./simply-bike";
import { CubeAdapter } from "./cube";
import { TrekAdapter } from "./trek";
import { RadonAdapter } from "./radon";
import { RieseMuellerAdapter } from "./riese-mueller";
import { HaibikeAdapter } from "./haibike";
import { BullsAdapter } from "./bulls";
import { OrbeaAdapter } from "./orbea";
import { KtmBikesAdapter } from "./ktm-bikes";
import { GhostBikesAdapter } from "./ghost-bikes";
import { ScottAdapter } from "./scott";
import { KalkhoffAdapter } from "./kalkhoff";
import { WinoraAdapter } from "./winora";
import { CenturionAdapter } from "./centurion";
import { PegasusAdapter } from "./pegasus";
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

class TestRoseBikes extends RoseBikesAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestBike24 extends Bike24Adapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestHibike extends HibikeAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestFahrradDe extends FahrradDeAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestSportBittl extends SportBittlAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestZweiradStadler extends ZweiradStadlerAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestBikester extends BikesterAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestBOC extends BOCAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestCanyon extends CanyonAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestDecathlon extends DecathlonAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestSpecialized extends SpecializedAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestSimplyBike extends SimplyBikeAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestCube extends CubeAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestTrek extends TrekAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestRadon extends RadonAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestRieseMueller extends RieseMuellerAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestHaibike extends HaibikeAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestBulls extends BullsAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestOrbea extends OrbeaAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestKtmBikes extends KtmBikesAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestGhostBikes extends GhostBikesAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestScott extends ScottAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestKalkhoff extends KalkhoffAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestWinora extends WinoraAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestCenturion extends CenturionAdapter {
  parse(html: string, path: string): Bike[] {
    return this.stampAndRecord(this.parseListing(html, path));
  }
}

class TestPegasus extends PegasusAdapter {
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

  it("parses 3 valid bikes and skips 1 invalid card", () => {
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
// Rose Bikes
// ---------------------------------------------------------------------------

describe("RoseBikesAdapter contract", () => {
  const adapter = new TestRoseBikes();
  const html = fixture("rose-bikes-ebikes.html");
  const bikes = adapter.parse(html, "/fahrraeder/e-bike");

  it("parses 3 valid bikes", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Rose Bikes");
  });

  it("parses Cross E 10 with list price", () => {
    const bike = bikes.find((b) => b.name.includes("Cross E 10"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(3299);
    expect(bike!.listPrice).toBe(3699);
    expect(bike!.category).toBe("E-Bike");
  });

  it("parses Urban Street without discount", () => {
    const bike = bikes.find((b) => b.name.includes("Urban Street"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2499);
    expect(bike!.listPrice).toBeUndefined();
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/fahrraeder/e-bike")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Bike24
// ---------------------------------------------------------------------------

describe("Bike24Adapter contract", () => {
  const adapter = new TestBike24();
  const html = fixture("bike24-ebikes.html");
  const bikes = adapter.parse(html, "/fahrraeder/e-bikes/");

  it("parses 3 valid bikes", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Bike24");
  });

  it("parses Trek Powerfly with offer price", () => {
    const bike = bikes.find((b) => b.name.includes("Trek Powerfly"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2899);
    expect(bike!.listPrice).toBe(3199);
    expect(bike!.category).toBe("E-Bike");
  });

  it("parses Cube Touring without discount", () => {
    const bike = bikes.find((b) => b.name.includes("Cube Touring"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(3199);
    expect(bike!.listPrice).toBeUndefined();
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/fahrraeder/e-bikes/")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Hibike
// ---------------------------------------------------------------------------

describe("HibikeAdapter contract", () => {
  const adapter = new TestHibike();
  const html = fixture("hibike-ebikes.html");
  const bikes = adapter.parse(html, "/c/e-bikes/");

  it("parses 3 valid bikes and skips 1 without price", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Hibike");
  });

  it("parses Haibike with offer price and list price", () => {
    const bike = bikes.find((b) => b.name.includes("Haibike"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(3199);
    expect(bike!.listPrice).toBe(3599);
    expect(bike!.offerPrice).toBe(3199);
    expect(bike!.category).toBe("E-Bike");
  });

  it("parses Cube Touring without discount", () => {
    const bike = bikes.find((b) => b.name.includes("Cube Touring"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(1199);
    expect(bike!.listPrice).toBeUndefined();
  });

  it("parses Specialized Turbo Vado with batteryWh inferred from name", () => {
    const bike = bikes.find((b) => b.name.includes("Specialized"));
    expect(bike).toBeDefined();
    expect(bike!.batteryWh).toBe(500);
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/c/e-bikes/")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/c/e-bikes/")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Brügelmann (now fahrrad.de)
// ---------------------------------------------------------------------------

describe("FahrradDeAdapter contract (formerly Brügelmann)", () => {
  const adapter = new TestFahrradDe();
  const html = fixture("bruegelmann-ebikes.html"); // fixture HTML still valid — same selectors
  const bikes = adapter.parse(html, "/fahrraeder/e-bikes/");

  it("parses 3 valid bikes and skips 1 without price", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "fahrrad.de");
  });

  it("parses Kalkhoff with offer price and list price", () => {
    const bike = bikes.find((b) => b.name.includes("Kalkhoff"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2699);
    expect(bike!.listPrice).toBe(2999);
    expect(bike!.offerPrice).toBe(2699);
    expect(bike!.category).toBe("E-Bike");
  });

  it("parses Stevens without discount", () => {
    const bike = bikes.find((b) => b.name.includes("Stevens"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2999);
    expect(bike!.listPrice).toBeUndefined();
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/fahrraeder/e-bikes/")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/fahrraeder/e-bikes/")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Sport Bittl
// ---------------------------------------------------------------------------

describe("SportBittlAdapter contract", () => {
  const adapter = new TestSportBittl();
  const html = fixture("sport-bittl-ebikes.html");
  const bikes = adapter.parse(html, "/fahrraeder/e-bikes/");

  it("parses 3 valid bikes and skips 1 without price", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Sport Bittl");
  });

  it("parses Kalkhoff with offer price and list price", () => {
    const bike = bikes.find((b) => b.name.includes("Kalkhoff"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2899);
    expect(bike!.listPrice).toBe(3299);
    expect(bike!.offerPrice).toBe(2899);
    expect(bike!.category).toBe("E-Bike");
    expect(bike!.batteryWh).toBe(625);
  });

  it("parses Focus Jarifa without discount", () => {
    const bike = bikes.find((b) => b.name.includes("Focus"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(3499);
    expect(bike!.listPrice).toBeUndefined();
  });

  it("parses Haibike HardNine and infers hardtail suspension", () => {
    const bike = bikes.find((b) => b.name.includes("Haibike"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(999);
    expect(bike!.listPrice).toBe(1299);
    expect(bike!.suspension).toBe("hardtail");
  });

  it("reads availability from stock element", () => {
    const bike = bikes.find((b) => b.name.includes("Kalkhoff"));
    expect(bike!.availability).toBe("Auf Lager");
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/fahrraeder/e-bikes/")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/fahrraeder/e-bikes/")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Zweirad Stadler
// ---------------------------------------------------------------------------

describe("ZweiradStadlerAdapter contract", () => {
  const adapter = new TestZweiradStadler();
  const html = fixture("zweirad-stadler-ebikes.html");
  const bikes = adapter.parse(html, "/fahrraeder/e-bikes/");

  it("parses 3 valid bikes and skips 1 without price", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Zweirad Stadler");
  });

  it("parses Cube Kathmandu with offer price and list price", () => {
    const bike = bikes.find((b) => b.name.includes("Cube Kathmandu"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(3799);
    expect(bike!.listPrice).toBe(4199);
    expect(bike!.offerPrice).toBe(3799);
    expect(bike!.category).toBe("E-Bike");
  });

  it("parses Trek Marlin without discount", () => {
    const bike = bikes.find((b) => b.name.includes("Trek Marlin"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(699);
    expect(bike!.listPrice).toBeUndefined();
    expect(bike!.category).toBe("E-Bike");
  });

  it("parses Stevens Courier with discount", () => {
    const bike = bikes.find((b) => b.name.includes("Stevens"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(1199);
    expect(bike!.listPrice).toBe(1399);
    expect(bike!.category).toBe("E-Bike");
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/fahrraeder/e-bikes/")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/fahrraeder/e-bikes/")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Bikester
// ---------------------------------------------------------------------------

describe("BikesterAdapter contract", () => {
  const adapter = new TestBikester();
  const html = fixture("bikester-ebikes.html");
  const bikes = adapter.parse(html, "/fahrraeder/e-bikes/");

  it("parses 3 valid bikes and skips 1 without price", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Bikester");
  });

  it("parses Bulls Lacuba with offer price and list price", () => {
    const bike = bikes.find((b) => b.name.includes("Bulls"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(3499);
    expect(bike!.listPrice).toBe(3899);
    expect(bike!.offerPrice).toBe(3499);
    expect(bike!.category).toBe("E-Bike");
  });

  it("parses Bergamont without discount and infers hardtail suspension", () => {
    const bike = bikes.find((b) => b.name.includes("Bergamont"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(3299);
    expect(bike!.listPrice).toBeUndefined();
    expect(bike!.suspension).toBe("hardtail");
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/fahrraeder/e-bikes/")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/fahrraeder/e-bikes/")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// B.O.C.
// ---------------------------------------------------------------------------

describe("BOCAdapter contract", () => {
  const adapter = new TestBOC();
  const html = fixture("boc-ebikes.html");
  const bikes = adapter.parse(html, "/collections/e-bikes");

  it("parses 3 valid bikes and skips 2 invalid cards", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "B.O.C.");
  });

  it("parses Kettler with sale price and list price", () => {
    const kettler = bikes.find((b) => b.name.includes("Kettler"));
    expect(kettler).toBeDefined();
    expect(kettler!.price).toBe(1999);
    expect(kettler!.listPrice).toBe(3799);
    expect(kettler!.offerPrice).toBe(1999);
    expect(kettler!.brand).toBe("Kettler");
    expect(kettler!.category).toBe("E-Bike");
  });

  it("parses Cube without discount", () => {
    const cube = bikes.find((b) => b.name.includes("Cube Kathmandu Hybrid ONE"));
    expect(cube).toBeDefined();
    expect(cube!.price).toBe(3199);
    expect(cube!.listPrice).toBeUndefined();
    expect(cube!.brand).toBe("Cube");
  });

  it("parses image URL with https prefix", () => {
    const kettler = bikes.find((b) => b.name.includes("Kettler"));
    expect(kettler?.imageUrl).toMatch(/^https:\/\//);
  });

  it("sets sourceId from handle attribute", () => {
    const kettler = bikes.find((b) => b.name.includes("Kettler"));
    expect(kettler?.sourceId).toBe("kettler-quadriga-town-country-p10");
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/collections/e-bikes")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/collections/e-bikes")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Canyon
// ---------------------------------------------------------------------------

describe("CanyonAdapter contract", () => {
  const adapter = new TestCanyon();
  const html = fixture("canyon-ebikes.html");
  const bikes = adapter.parse(html, "/de-de/e-bikes/");

  it("parses 3 bikes from JSON-LD", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Canyon");
  });

  it("parses Canyon Spectral:ON with correct price", () => {
    const bike = bikes.find((b) => b.name.includes("Spectral"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(4499);
    expect(bike!.brand).toBe("Canyon");
    expect(bike!.sourceId).toBe("3810");
  });

  it("parses Canyon Pathlite:ON Trekking bike", () => {
    const bike = bikes.find((b) => b.name.includes("Pathlite"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2999);
    expect(bike!.batteryWh).toBe(750);
  });

  it("parses Canyon Commuter:ON City bike", () => {
    const bike = bikes.find((b) => b.name.includes("Commuter"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2199);
    expect(bike!.batteryWh).toBe(500);
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/de-de/e-bikes/")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/de-de/e-bikes/")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Decathlon
// ---------------------------------------------------------------------------

describe("DecathlonAdapter contract", () => {
  const adapter = new TestDecathlon();
  const html = fixture("decathlon-ebikes.html");
  const bikes = adapter.parse(html, "/browse/c0-fahrraeder/_/N-1nfp7h6");

  it("parses 3 bikes from JSON-LD", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Decathlon");
  });

  it("parses Riverside 500E with correct price and sku", () => {
    const bike = bikes.find((b) => b.name.includes("Riverside"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(1299.99);
    expect(bike!.brand).toBe("Decathlon");
    expect(bike!.sourceId).toBe("8665985");
  });

  it("parses EXPL 900 mountainbike", () => {
    const bike = bikes.find((b) => b.name.includes("EXPL"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2999.99);
  });

  it("parses Elops 500E city bike", () => {
    const bike = bikes.find((b) => b.name.includes("Elops"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(999.99);
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/browse/c0-fahrraeder/_/N-1nfp7h6")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/browse/c0-fahrraeder/_/N-1nfp7h6")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Specialized
// ---------------------------------------------------------------------------

describe("SpecializedAdapter contract", () => {
  const adapter = new TestSpecialized();
  const html = fixture("specialized-ebikes.html");
  const bikes = adapter.parse(html, "/de/de/electric");

  it("parses 3 bikes from JSON-LD", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Specialized");
  });

  it("parses Turbo Vado SL with correct price", () => {
    const bike = bikes.find((b) => b.name.includes("Vado"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(4500);
    expect(bike!.brand).toBe("Specialized");
    expect(bike!.sourceId).toBe("96922-6004");
  });

  it("parses Turbo Levo Comp e-mountainbike", () => {
    const bike = bikes.find((b) => b.name.includes("Levo"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(6000);
    expect(bike!.suspension).toBe("fully");
  });

  it("parses Turbo Como SL and infers batteryWh", () => {
    const bike = bikes.find((b) => b.name.includes("Como"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(3500);
    expect(bike!.batteryWh).toBe(320);
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/de/de/electric")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/de/de/electric")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Simply Bike
// ---------------------------------------------------------------------------

describe("SimplyBikeAdapter contract", () => {
  const adapter = new TestSimplyBike();
  const html = fixture("simply-bike-ebikes.html");
  const bikes = adapter.parse(html, "/collections/e-bikes");

  it("parses 3 valid bikes and skips 1 without price", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Simply Bike");
  });

  it("parses Kalkhoff with offer price and list price", () => {
    const bike = bikes.find((b) => b.name.includes("Kalkhoff"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2599);
    expect(bike!.listPrice).toBe(2899);
    expect(bike!.offerPrice).toBe(2599);
    expect(bike!.category).toBe("E-Bike");
  });

  it("parses Winora Sinus without discount", () => {
    const bike = bikes.find((b) => b.name.includes("Winora"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2299);
    expect(bike!.listPrice).toBeUndefined();
  });

  it("parses Hercules Rob Cross with sale price", () => {
    const bike = bikes.find((b) => b.name.includes("Hercules"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(1899);
    expect(bike!.listPrice).toBe(2099);
    expect(bike!.batteryWh).toBe(625);
  });

  it("sets sourceId from data-product-id", () => {
    const bike = bikes.find((b) => b.name.includes("Kalkhoff"));
    expect(bike!.sourceId).toBe("SMPL-001");
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/collections/e-bikes")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/collections/e-bikes")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Haibike
// ---------------------------------------------------------------------------

describe("HaibikeAdapter contract", () => {
  const adapter = new TestHaibike();
  const html = fixture("haibike-adapter-ebikes.html");
  const bikes = adapter.parse(html, "/de/bikes/e-mountainbike/");

  it("parses 3 bikes from JSON-LD", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Haibike");
  });

  it("parses AllMtn 5 Fully e-MTB with batteryWh and suspension", () => {
    const bike = bikes.find((b) => b.name.includes("AllMtn"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(3799);
    expect(bike!.brand).toBe("Haibike");
    expect(bike!.batteryWh).toBe(750);
    expect(bike!.suspension).toBe("fully");
    expect(bike!.sourceId).toBe("HB-AMT5-2025");
  });

  it("parses Trekking 4 with batteryWh inferred", () => {
    const bike = bikes.find((b) => b.name.includes("Trekking 4"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2299);
    expect(bike!.batteryWh).toBe(500);
  });

  it("parses HardNine 5 hardtail e-MTB", () => {
    const bike = bikes.find((b) => b.name.includes("HardNine"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2799);
    expect(bike!.suspension).toBe("hardtail");
    expect(bike!.batteryWh).toBe(630);
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/de/bikes/e-mountainbike/")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/de/bikes/e-mountainbike/")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// BULLS
// ---------------------------------------------------------------------------

describe("BullsAdapter contract", () => {
  const adapter = new TestBulls();
  const html = fixture("bulls-ebikes.html");
  const bikes = adapter.parse(html, "/fahrraeder/e-bikes/");

  it("parses 3 bikes from JSON-LD", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "BULLS");
  });

  it("parses Lacuba Evo E45 trekking bike with batteryWh", () => {
    const bike = bikes.find((b) => b.name.includes("Lacuba"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(3299);
    expect(bike!.brand).toBe("BULLS");
    expect(bike!.batteryWh).toBe(625);
    expect(bike!.sourceId).toBe("BULLS-LACE45-2025");
  });

  it("parses Iconic Evo Cross 1 and infers belt drive", () => {
    const bike = bikes.find((b) => b.name.includes("Iconic"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2699);
    expect(bike!.driveType).toBe("belt");
    expect(bike!.batteryWh).toBe(500);
  });

  it("parses Copperhead EVO AM 3 fully e-MTB", () => {
    const bike = bikes.find((b) => b.name.includes("Copperhead"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(4999);
    expect(bike!.suspension).toBe("fully");
    expect(bike!.batteryWh).toBe(750);
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/fahrraeder/e-bikes/")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/fahrraeder/e-bikes/")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Orbea
// ---------------------------------------------------------------------------

describe("OrbeaAdapter contract", () => {
  const adapter = new TestOrbea();
  const html = fixture("orbea-ebikes.html");
  const bikes = adapter.parse(html, "/de-de/elektrische-fahrraeder/");

  it("parses 3 bikes from JSON-LD", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Orbea");
  });

  it("parses Vibe Mid H30 city e-bike", () => {
    const bike = bikes.find((b) => b.name.includes("Vibe"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2299);
    expect(bike!.brand).toBe("Orbea");
    expect(bike!.batteryWh).toBe(360);
    expect(bike!.sourceId).toBe("N35157IB");
  });

  it("parses Rise LT M20 fully e-MTB", () => {
    const bike = bikes.find((b) => b.name.includes("Rise"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(5499);
    expect(bike!.suspension).toBe("fully");
    expect(bike!.batteryWh).toBe(540);
  });

  it("parses Gain M30 e-road bike", () => {
    const bike = bikes.find((b) => b.name.includes("Gain"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(3499);
    expect(bike!.batteryWh).toBe(360);
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/de-de/elektrische-fahrraeder/")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/de-de/elektrische-fahrraeder/")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// KTM Bikes
// ---------------------------------------------------------------------------

describe("KtmBikesAdapter contract", () => {
  const adapter = new TestKtmBikes();
  const html = fixture("ktm-bikes-ebikes.html");
  const bikes = adapter.parse(html, "/de/e-bikes/");

  it("parses 3 bikes from JSON-LD", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "KTM Bikes");
  });

  it("parses Macina Style 730 trekking bike", () => {
    const bike = bikes.find((b) => b.name.includes("Style"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(3499);
    expect(bike!.brand).toBe("KTM");
    expect(bike!.batteryWh).toBe(625);
    expect(bike!.sourceId).toBe("KTM-MS730-2025");
  });

  it("parses Macina Chacana 772 fully e-MTB", () => {
    const bike = bikes.find((b) => b.name.includes("Chacana"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(4799);
    expect(bike!.suspension).toBe("fully");
    expect(bike!.batteryWh).toBe(750);
  });

  it("parses Macina Gran 610 hardtail city bike", () => {
    const bike = bikes.find((b) => b.name.includes("Gran"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2199);
    expect(bike!.suspension).toBe("hardtail");
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/de/e-bikes/")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/de/e-bikes/")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Ghost Bikes
// ---------------------------------------------------------------------------

describe("GhostBikesAdapter contract", () => {
  const adapter = new TestGhostBikes();
  const html = fixture("ghost-bikes-ebikes.html");
  const bikes = adapter.parse(html, "/de/e-bikes/");

  it("parses 3 bikes from JSON-LD", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Ghost Bikes");
  });

  it("parses E-ASX Universal 160 fully e-MTB", () => {
    const bike = bikes.find((b) => b.name.includes("ASX"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(4299);
    expect(bike!.brand).toBe("Ghost");
    expect(bike!.suspension).toBe("fully");
    expect(bike!.batteryWh).toBe(750);
    expect(bike!.sourceId).toBe("GHOST-EASX160-2025");
  });

  it("parses E-Hybride Trekking hardtail with batteryWh", () => {
    const bike = bikes.find((b) => b.name.includes("Hybride"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(1999);
    expect(bike!.suspension).toBe("hardtail");
    expect(bike!.batteryWh).toBe(500);
  });

  it("parses Kato EQ hardtail e-MTB", () => {
    const bike = bikes.find((b) => b.name.includes("Kato"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2699);
    expect(bike!.suspension).toBe("hardtail");
    expect(bike!.batteryWh).toBe(630);
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/de/e-bikes/")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/de/e-bikes/")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Cube
// ---------------------------------------------------------------------------

describe("CubeAdapter contract", () => {
  const adapter = new TestCube();
  const html = fixture("cube-ebikes.html");
  const bikes = adapter.parse(html, "/de-de/bikes-list/e-bikes/");

  it("parses 3 bikes from JSON-LD", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Cube");
  });

  it("parses Kathmandu Hybrid ONE with correct price", () => {
    const bike = bikes.find((b) => b.name.includes("Kathmandu"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(3299);
    expect(bike!.brand).toBe("Cube");
    expect(bike!.sourceId).toBe("683201");
    expect(bike!.batteryWh).toBe(750);
  });

  it("parses Stereo Hybrid 140 and infers fully suspension", () => {
    const bike = bikes.find((b) => b.name.includes("Stereo"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(5499);
    expect(bike!.suspension).toBe("fully");
  });

  it("parses Town Hybrid Pro city bike", () => {
    const bike = bikes.find((b) => b.name.includes("Town"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(1899);
    // "400" in model name refers to battery capacity but no " Wh" suffix — not inferred
    expect(bike!.category).toBe("E-Bike");
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/de-de/bikes-list/e-bikes/")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/de-de/bikes-list/e-bikes/")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Trek
// ---------------------------------------------------------------------------

describe("TrekAdapter contract", () => {
  const adapter = new TestTrek();
  const html = fixture("trek-ebikes.html");
  const bikes = adapter.parse(html, "/de-de/bikes/category/elektrisch/");

  it("parses 3 bikes from JSON-LD", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Trek");
  });

  it("parses Trek Allant+ 7 city bike", () => {
    const bike = bikes.find((b) => b.name.includes("Allant"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(3199);
    expect(bike!.brand).toBe("Trek");
    expect(bike!.sourceId).toBe("5277004");
  });

  it("parses Trek Rail 5 e-mountainbike and infers fully suspension", () => {
    const bike = bikes.find((b) => b.name.includes("Rail"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(4799);
    expect(bike!.suspension).toBe("fully");
  });

  it("parses Trek Domane+ AL 5 e-road bike", () => {
    const bike = bikes.find((b) => b.name.includes("Domane"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(3999);
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/de-de/bikes/category/elektrisch/")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/de-de/bikes/category/elektrisch/")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Radon Bikes
// ---------------------------------------------------------------------------

describe("RadonAdapter contract", () => {
  const adapter = new TestRadon();
  const html = fixture("radon-ebikes.html");
  const bikes = adapter.parse(html, "/e-bike/");

  it("parses 3 bikes from JSON-LD", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Radon Bikes");
  });

  it("parses Skeen Trail 10.0 trekking bike", () => {
    const bike = bikes.find((b) => b.name.includes("Skeen"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(3299);
    expect(bike!.brand).toBe("Radon");
    expect(bike!.sourceId).toBe("SKT10-2025");
  });

  it("parses Render Trail 7.0 and infers hardtail suspension", () => {
    const bike = bikes.find((b) => b.name.includes("Render"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2799);
    expect(bike!.suspension).toBe("hardtail");
  });

  it("parses Sunset Grand Tourer city bike and infers batteryWh", () => {
    const bike = bikes.find((b) => b.name.includes("Sunset"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2199);
    expect(bike!.batteryWh).toBe(500);
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/e-bike/")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/e-bike/")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Riese & Müller
// ---------------------------------------------------------------------------

describe("RieseMuellerAdapter contract", () => {
  const adapter = new TestRieseMueller();
  const html = fixture("riese-mueller-ebikes.html");
  const bikes = adapter.parse(html, "/bikes/");

  it("parses 3 bikes from JSON-LD", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Riese & Müller");
  });

  it("parses Charger4 GT Rohloff and defaults to E-Bike category", () => {
    const bike = bikes.find((b) => b.name.includes("Charger4"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(5999);
    expect(bike!.brand).toBe("Riese & Müller");
    expect(bike!.category).toBe("E-Bike");
    expect(bike!.sourceId).toBe("RM-CH4-ROHLOFF");
  });

  it("parses Delite GT Rohloff fully e-MTB", () => {
    const bike = bikes.find((b) => b.name.includes("Delite"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(7999);
    expect(bike!.suspension).toBe("fully");
    expect(bike!.category).toBe("E-Bike");
  });

  it("parses Load 75 cargo e-bike", () => {
    const bike = bikes.find((b) => b.name.includes("Load"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(6499);
    expect(bike!.category).toBe("E-Bike");
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/bikes/")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/bikes/")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Scott
// ---------------------------------------------------------------------------

describe("ScottAdapter contract", () => {
  const adapter = new TestScott();
  const html = fixture("scott-ebikes.html");
  const bikes = adapter.parse(html, "/de/bikes/e-bikes/");

  it("parses 3 bikes from JSON-LD", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Scott");
  });

  it("parses Patron eRIDE 920 fully e-MTB", () => {
    const bike = bikes.find((b) => b.name.includes("Patron"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(4499);
    expect(bike!.brand).toBe("Scott");
    expect(bike!.suspension).toBe("fully");
    expect(bike!.batteryWh).toBe(750);
    expect(bike!.sourceId).toBe("296204");
  });

  it("parses Sub Sport eRIDE 30 trekking bike", () => {
    const bike = bikes.find((b) => b.name.includes("Sub Sport"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2799);
    expect(bike!.batteryWh).toBe(500);
  });

  it("parses Solace eRIDE 30 e-road bike", () => {
    const bike = bikes.find((b) => b.name.includes("Solace"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(5299);
    expect(bike!.batteryWh).toBe(250);
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/de/bikes/e-bikes/")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/de/bikes/e-bikes/")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Kalkhoff
// ---------------------------------------------------------------------------

describe("KalkhoffAdapter contract", () => {
  const adapter = new TestKalkhoff();
  const html = fixture("kalkhoff-ebikes.html");
  const bikes = adapter.parse(html, "/de/e-bikes/");

  it("parses 3 bikes from JSON-LD", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Kalkhoff");
  });

  it("parses Endeavour 5 Advance trekking bike with batteryWh", () => {
    const bike = bikes.find((b) => b.name.includes("Endeavour"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(3199);
    expect(bike!.brand).toBe("Kalkhoff");
    expect(bike!.batteryWh).toBe(625);
    expect(bike!.category).toBe("E-Bike");
    expect(bike!.sourceId).toBe("KLK-E5AB625-2025");
  });

  it("parses Image 5.B Advance+ and infers belt drive", () => {
    const bike = bikes.find((b) => b.name.includes("Image"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2699);
    expect(bike!.driveType).toBe("belt");
    expect(bike!.batteryWh).toBe(500);
  });

  it("parses Entice 5 Advance fully e-MTB", () => {
    const bike = bikes.find((b) => b.name.includes("Entice"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(3999);
    expect(bike!.suspension).toBe("fully");
    expect(bike!.batteryWh).toBe(750);
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/de/e-bikes/")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/de/e-bikes/")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Winora
// ---------------------------------------------------------------------------

describe("WinoraAdapter contract", () => {
  const adapter = new TestWinora();
  const html = fixture("winora-ebikes.html");
  const bikes = adapter.parse(html, "/bikes/e-bikes/");

  it("parses 3 bikes from JSON-LD", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Winora");
  });

  it("parses Sinus R8f e-trekking bike", () => {
    const bike = bikes.find((b) => b.name.includes("Sinus"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2799);
    expect(bike!.brand).toBe("Winora");
    expect(bike!.batteryWh).toBe(500);
    expect(bike!.sourceId).toBe("WIN-SR8F-2025");
  });

  it("parses Yakun 12 fully e-MTB", () => {
    const bike = bikes.find((b) => b.name.includes("Yakun"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(4499);
    expect(bike!.suspension).toBe("fully");
    expect(bike!.batteryWh).toBe(750);
  });

  it("parses Tria N8f e-city and infers belt drive", () => {
    const bike = bikes.find((b) => b.name.includes("Tria"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2199);
    expect(bike!.driveType).toBe("belt");
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/bikes/e-bikes/")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/bikes/e-bikes/")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Centurion
// ---------------------------------------------------------------------------

describe("CenturionAdapter contract", () => {
  const adapter = new TestCenturion();
  const html = fixture("centurion-ebikes.html");
  const bikes = adapter.parse(html, "/fahrraeder/e-bikes/");

  it("parses 3 bikes from JSON-LD", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Centurion");
  });

  it("parses E-Fire Trail 4000i fully e-MTB", () => {
    const bike = bikes.find((b) => b.name.includes("Fire Trail"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(3799);
    expect(bike!.brand).toBe("Centurion");
    expect(bike!.suspension).toBe("fully");
    expect(bike!.batteryWh).toBe(630);
    expect(bike!.sourceId).toBe("CEN-EFT4000-2025");
  });

  it("parses E-Backfire Fit 4000 trekking bike", () => {
    const bike = bikes.find((b) => b.name.includes("Backfire"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2499);
    expect(bike!.batteryWh).toBe(500);
  });

  it("parses E-Roller 2000i city bike", () => {
    const bike = bikes.find((b) => b.name.includes("Roller"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(1999);
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/fahrraeder/e-bikes/")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/fahrraeder/e-bikes/")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Pegasus
// ---------------------------------------------------------------------------

describe("PegasusAdapter contract", () => {
  const adapter = new TestPegasus();
  const html = fixture("pegasus-ebikes.html");
  const bikes = adapter.parse(html, "/bikes/e-bikes/");

  it("parses 3 bikes from JSON-LD", () => {
    expect(bikes.length).toBe(3);
  });

  it("each bike satisfies the contract", () => {
    for (const bike of bikes) assertBikeContract(bike, "Pegasus");
  });

  it("parses Premio EVO 10 Lite trekking bike", () => {
    const bike = bikes.find((b) => b.name.includes("Premio"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2999);
    expect(bike!.brand).toBe("Pegasus");
    expect(bike!.batteryWh).toBe(625);
    expect(bike!.sourceId).toBe("PEG-PEVO10L-2025");
  });

  it("parses Solero Evo e-city and infers belt drive", () => {
    const bike = bikes.find((b) => b.name.includes("Solero"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(1999);
    expect(bike!.driveType).toBe("belt");
    expect(bike!.batteryWh).toBe(500);
  });

  it("parses Furiosa Evo hardtail e-MTB", () => {
    const bike = bikes.find((b) => b.name.includes("Furiosa"));
    expect(bike).toBeDefined();
    expect(bike!.price).toBe(2799);
    expect(bike!.suspension).toBe("hardtail");
    expect(bike!.batteryWh).toBe(630);
  });

  it("returns empty array for empty HTML", () => {
    expect(adapter.parse("<html><body></body></html>", "/bikes/e-bikes/")).toEqual([]);
  });

  it("returns empty array for garbled HTML", () => {
    expect(adapter.parse("<<GARBLED##", "/bikes/e-bikes/")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Cross-adapter: all parsed bikes pass the unified BikeSchema
// ---------------------------------------------------------------------------

type AnyTestAdapter =
  | TestFahrradXXL | TestLuckyBike | TestBikeDiscount | TestRoseBikes | TestBike24
  | TestHibike | TestFahrradDe | TestBikester | TestSportBittl | TestZweiradStadler
  | TestBOC | TestCanyon | TestDecathlon | TestSpecialized | TestSimplyBike
  | TestCube | TestTrek | TestRadon | TestRieseMueller
  | TestHaibike | TestBulls | TestOrbea | TestKtmBikes | TestGhostBikes
  | TestScott | TestKalkhoff | TestWinora | TestCenturion | TestPegasus;

describe("All adapters: unified schema compliance", () => {
  const cases: [string, AnyTestAdapter, string, string][] = [
    ["fahrrad-xxl-ebikes.html", new TestFahrradXXL(), "/fahrraeder/e-bikes", "Fahrrad XXL"],
    ["lucky-bike-ebikes.html", new TestLuckyBike(), "/e-bikes/", "Lucky Bike"],
    ["bike-discount-ebikes.html", new TestBikeDiscount(), "/fahrraeder/e-bikes", "Bike-Discount"],
    ["rose-bikes-ebikes.html", new TestRoseBikes(), "/fahrraeder/e-bike", "Rose Bikes"],
    ["bike24-ebikes.html", new TestBike24(), "/fahrraeder/e-bikes/", "Bike24"],
    ["hibike-ebikes.html", new TestHibike(), "/c/e-bikes/", "Hibike"],
    ["bruegelmann-ebikes.html", new TestFahrradDe(), "/fahrraeder/e-bikes/", "fahrrad.de"],
    ["bikester-ebikes.html", new TestBikester(), "/fahrraeder/e-bikes/", "Bikester"],
    ["sport-bittl-ebikes.html", new TestSportBittl(), "/fahrraeder/e-bikes/", "Sport Bittl"],
    ["zweirad-stadler-ebikes.html", new TestZweiradStadler(), "/fahrraeder/e-bikes/", "Zweirad Stadler"],
    ["boc-ebikes.html", new TestBOC(), "/collections/e-bikes", "B.O.C."],
    ["canyon-ebikes.html", new TestCanyon(), "/de-de/e-bikes/", "Canyon"],
    ["decathlon-ebikes.html", new TestDecathlon(), "/browse/c0-fahrraeder/_/N-1nfp7h6", "Decathlon"],
    ["specialized-ebikes.html", new TestSpecialized(), "/de/de/electric", "Specialized"],
    ["simply-bike-ebikes.html", new TestSimplyBike(), "/collections/e-bikes", "Simply Bike"],
    ["cube-ebikes.html", new TestCube(), "/de-de/bikes-list/e-bikes/", "Cube"],
    ["trek-ebikes.html", new TestTrek(), "/de-de/bikes/category/elektrisch/", "Trek"],
    ["radon-ebikes.html", new TestRadon(), "/e-bike/", "Radon Bikes"],
    ["riese-mueller-ebikes.html", new TestRieseMueller(), "/bikes/", "Riese & Müller"],
    ["haibike-adapter-ebikes.html", new TestHaibike(), "/de/bikes/e-mountainbike/", "Haibike"],
    ["bulls-ebikes.html", new TestBulls(), "/fahrraeder/e-bikes/", "BULLS"],
    ["orbea-ebikes.html", new TestOrbea(), "/de-de/elektrische-fahrraeder/", "Orbea"],
    ["ktm-bikes-ebikes.html", new TestKtmBikes(), "/de/e-bikes/", "KTM Bikes"],
    ["ghost-bikes-ebikes.html", new TestGhostBikes(), "/de/e-bikes/", "Ghost Bikes"],
    ["scott-ebikes.html", new TestScott(), "/de/bikes/e-bikes/", "Scott"],
    ["kalkhoff-ebikes.html", new TestKalkhoff(), "/de/e-bikes/", "Kalkhoff"],
    ["winora-ebikes.html", new TestWinora(), "/bikes/e-bikes/", "Winora"],
    ["centurion-ebikes.html", new TestCenturion(), "/fahrraeder/e-bikes/", "Centurion"],
    ["pegasus-ebikes.html", new TestPegasus(), "/bikes/e-bikes/", "Pegasus"],
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
