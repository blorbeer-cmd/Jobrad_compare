/**
 * Bike persistence service.
 *
 * Syncs a batch of fetched Bike objects from an adapter into the normalized
 * DB tables (Dealer → BikeModel → BikeListing → PriceSnapshot).
 *
 * Design principles:
 * - All DB operations are non-critical: errors are logged but never thrown
 * - Upsert-based: safe to call repeatedly with the same data
 * - Price snapshots are only written when the price actually changes
 * - The in-memory cache remains the primary source; DB is durable storage
 */

import { db } from "@/lib/db";
import type { Bike } from "@/adapters/types";

// ---------------------------------------------------------------------------
// Canonical key helpers
// ---------------------------------------------------------------------------

/**
 * Derive a stable, normalized key for a bike model.
 * Used to identify the same model appearing under slightly different names.
 * Format: "brand:model-name-slug"
 */
function toCanonicalKey(brand: string, modelName: string): string {
  const slug = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");
  return `${slug(brand)}:${slug(modelName)}`;
}

/**
 * Derive the adapter key from the dealer name.
 * Keeps it URL-safe and unique enough for our small set of adapters.
 */
function toAdapterKey(dealerName: string): string {
  return dealerName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
}

// ---------------------------------------------------------------------------
// Upsert helpers
// ---------------------------------------------------------------------------

async function upsertDealer(name: string): Promise<string> {
  const adapterKey = toAdapterKey(name);
  const dealer = await db.dealer.upsert({
    where: { adapterKey },
    create: { name, adapterKey, lastFetchedAt: new Date() },
    update: { lastFetchedAt: new Date() },
    select: { id: true },
  });
  return dealer.id;
}

async function upsertBikeModel(bike: Bike): Promise<string> {
  const canonicalKey = toCanonicalKey(bike.brand, bike.name);
  const model = await db.bikeModel.upsert({
    where: { canonicalKey },
    create: {
      brand: bike.brand,
      modelName: bike.name,
      category: bike.category,
      canonicalKey,
    },
    update: {
      // Update category in case it changed
      category: bike.category,
    },
    select: { id: true },
  });
  return model.id;
}

async function upsertBikeListing(
  bike: Bike,
  bikeModelId: string,
  dealerId: string
): Promise<{ id: string; previousPrice: number | null }> {
  // Determine the stable unique key: prefer sourceId, fall back to URL slug
  const sourceId = bike.sourceId ?? bike.dealerUrl;

  const existing = await db.bikeListing.findUnique({
    where: { dealerId_sourceId: { dealerId, sourceId } },
    select: { id: true, price: true },
  });

  if (existing) {
    await db.bikeListing.update({
      where: { id: existing.id },
      data: {
        price: bike.price,
        listPrice: bike.listPrice ?? null,
        offerPrice: bike.offerPrice ?? null,
        url: bike.dealerUrl,
        imageUrl: bike.imageUrl ?? null,
        availability: bike.availability ?? null,
        lastSeenAt: new Date(),
        sourceType: bike.sourceType ?? "scrape",
      },
    });
    return { id: existing.id, previousPrice: existing.price };
  }

  const created = await db.bikeListing.create({
    data: {
      bikeModelId,
      dealerId,
      sourceId,
      sourceType: bike.sourceType ?? "scrape",
      price: bike.price,
      listPrice: bike.listPrice ?? null,
      offerPrice: bike.offerPrice ?? null,
      url: bike.dealerUrl,
      imageUrl: bike.imageUrl ?? null,
      availability: bike.availability ?? null,
      lastSeenAt: new Date(),
    },
    select: { id: true },
  });
  return { id: created.id, previousPrice: null };
}

async function maybeCreateSnapshot(
  bikeListingId: string,
  bike: Bike,
  previousPrice: number | null
): Promise<void> {
  const priceChanged = previousPrice === null || previousPrice !== bike.price;
  if (!priceChanged) return;

  await db.priceSnapshot.create({
    data: {
      bikeListingId,
      price: bike.price,
      listPrice: bike.listPrice ?? null,
      offerPrice: bike.offerPrice ?? null,
    },
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface PersistResult {
  upserted: number;
  priceChanges: number;
  errors: number;
}

/**
 * Persist a batch of bikes from a single dealer adapter to the DB.
 *
 * Errors in individual bike processing are caught and counted; the batch
 * continues regardless of individual failures.
 */
export async function persistBikes(
  bikes: Bike[],
  dealerName: string
): Promise<PersistResult> {
  if (bikes.length === 0) return { upserted: 0, priceChanges: 0, errors: 0 };

  let upserted = 0;
  let priceChanges = 0;
  let errors = 0;

  try {
    const dealerId = await upsertDealer(dealerName);

    const results = await Promise.allSettled(
      bikes.map(async (bike) => {
        const bikeModelId = await upsertBikeModel(bike);
        const { id: listingId, previousPrice } = await upsertBikeListing(bike, bikeModelId, dealerId);
        await maybeCreateSnapshot(listingId, bike, previousPrice);
        return { bike, previousPrice };
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        upserted++;
        const { bike, previousPrice } = result.value;
        if (previousPrice !== null && previousPrice !== bike.price) priceChanges++;
      } else {
        errors++;
        console.error("[bike-persistence] Error persisting bike:", result.reason);
      }
    }
  } catch (err) {
    console.error("[bike-persistence] Fatal error (dealer upsert):", dealerName, err);
    errors = bikes.length;
  }

  return { upserted, priceChanges, errors };
}

/**
 * Load all current bike listings from the DB, joined with model and dealer data.
 * Returns them as Bike objects compatible with the adapter output format.
 */
export async function loadBikesFromDb(limit = 2000): Promise<Bike[]> {
  const listings = await db.bikeListing.findMany({
    take: limit,
    include: {
      bikeModel: true,
      dealer: true,
    },
    orderBy: { lastSeenAt: "desc" },
  });

  return listings.map((l) => ({
    name: l.bikeModel.modelName,
    brand: l.bikeModel.brand,
    category: l.bikeModel.category as Bike["category"],
    price: l.price,
    listPrice: l.listPrice ?? undefined,
    offerPrice: l.offerPrice ?? undefined,
    dealer: l.dealer.name,
    dealerUrl: l.url,
    imageUrl: l.imageUrl ?? undefined,
    availability: l.availability ?? undefined,
    sourceId: l.sourceId ?? undefined,
    sourceType: (l.sourceType as Bike["sourceType"]) ?? "scrape",
    lastSeenAt: l.lastSeenAt.toISOString(),
  }));
}
