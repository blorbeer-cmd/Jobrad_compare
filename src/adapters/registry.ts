import type { Bike, DealerAdapter, AdapterHealth } from "./types";
import { BaseAdapter } from "./base-adapter";
import { cacheGet, cacheSet, cacheClear } from "./cache";
import { FahrradXXLAdapter } from "./fahrrad-xxl";
import { LuckyBikeAdapter } from "./lucky-bike";
import { BikeDiscountAdapter } from "./bike-discount";
import { RoseBikesAdapter } from "./rose-bikes";
import { Bike24Adapter } from "./bike24";
import { HibikeAdapter } from "./hibike";
import { FahrradDeAdapter } from "./bruegelmann";
import { BikesterAdapter } from "./bikester";
import { SportBittlAdapter } from "./sport-bittl";
import { ZweiradStadlerAdapter } from "./zweirad-stadler";
import {
  HibikeAwinAdapter,
  BikesterAwinAdapter,
  FahrradXXLAwinAdapter,
  BruegelmannAwinAdapter,
  LuckyBikeAwinAdapter,
  BikeDiscountAwinAdapter,
} from "./awin-dealers";
import { persistBikes, loadBikesFromDb } from "@/lib/bike-persistence";

// ---------------------------------------------------------------------------
// Adapter selection
// ---------------------------------------------------------------------------

/**
 * Build the active adapter list.
 *
 * Strategy:
 * - When AWIN_API_KEY is set and a dealer has AWIN_FEED_ID_* configured, the
 *   Awin feed adapter replaces the scraping adapter for that dealer.
 *   Benefit: structured data, no HTML fragility, brand/colour fields included.
 * - Dealers where scraping never worked (Lucky Bike, Bike Discount) are added
 *   only when their Awin feed ID is configured.
 * - Scraping adapters remain for all dealers without an Awin feed configured.
 */
function buildAdapters(): BaseAdapter[] {
  const hasAwinKey = !!process.env.AWIN_API_KEY;

  // Awin adapters — instantiated unconditionally; fetchBikes() returns [] when
  // the API key or feed ID is missing, so they are safe to instantiate always.
  const awinCandidates: BaseAdapter[] = hasAwinKey
    ? [
        new FahrradXXLAwinAdapter(),
        new HibikeAwinAdapter(),
        new BikesterAwinAdapter(),
        new BruegelmannAwinAdapter(),
        // The two below only work via Awin (scraping is not viable for them)
        new LuckyBikeAwinAdapter(),
        new BikeDiscountAwinAdapter(),
      ].filter((a) => (a as { feedId: number }).feedId > 0)
    : [];

  const awinDealerNames = new Set(awinCandidates.map((a) => a.name));

  // Scraping adapters — used for any dealer not covered by Awin
  const scrapingAdapters: BaseAdapter[] = [
    new FahrradXXLAdapter(),
    new RoseBikesAdapter(),     // Rose Bikes not on Awin — scraping only
    new Bike24Adapter(),
    new HibikeAdapter(),
    new FahrradDeAdapter(),     // formerly Brügelmann — bruegelmann.de → fahrrad.de
    new BikesterAdapter(),
    new SportBittlAdapter(),
    new ZweiradStadlerAdapter(),
    // LuckyBike + BikeDiscount scraping doesn't work — only via Awin above
  ].filter((a) => !awinDealerNames.has(a.name));

  return [...scrapingAdapters, ...awinCandidates];
}

// Re-evaluate on each module load so env changes in tests are picked up
const adapters: BaseAdapter[] = buildAdapters();

export interface FetchResult {
  bikes: Bike[];
  errors: { dealer: string; error: string }[];
  fromCache: boolean;
  fetchedAt: string;
}

function adapterCacheKey(name: string) {
  return `adapter:${name}`;
}

export async function fetchAllBikes(forceRefresh = false): Promise<FetchResult> {
  const active = adapters;
  const allBikes: Bike[] = [];
  const errors: { dealer: string; error: string }[] = [];
  let anyFresh = false;

  await Promise.all(
    active.map(async (adapter) => {
      const key = adapterCacheKey(adapter.name);

      if (!forceRefresh) {
        const cached = cacheGet<Bike[]>(key);
        if (cached) {
          allBikes.push(...cached);
          return;
        }
      }

      try {
        const bikes = await adapter.fetchBikes();
        if (bikes.length === 0) {
          console.warn(`[registry] WARNING: ${adapter.name} returned 0 bikes`);
          errors.push({ dealer: adapter.name, error: "0 bikes parsed — selectors may not match current HTML" });
        } else {
          console.log(`[registry] ${adapter.name}: ${bikes.length} bikes fetched`);
        }
        cacheSet(key, bikes, adapter.cacheTtlMs);
        allBikes.push(...bikes);
        anyFresh = true;
        // Persist to DB asynchronously — never blocks the API response
        persistBikes(bikes, adapter.name).catch((err) =>
          console.error(`[registry] DB persist failed for ${adapter.name}:`, err)
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push({ dealer: adapter.name, error: message });
        // Fall back to stale cache if available
        const stale = cacheGet<Bike[]>(key);
        if (stale) allBikes.push(...stale);
      }
    })
  );

  return {
    bikes: allBikes,
    errors,
    fromCache: !anyFresh,
    fetchedAt: new Date().toISOString(),
  };
}

export function getAdapterNames(): string[] {
  return adapters.map((a) => a.name);
}

export function getAdapterHealthStatuses(): AdapterHealth[] {
  return adapters.map((a) => a.getHealth());
}

/**
 * Force-refresh a single adapter by name. Clears its cache entry, fetches
 * fresh data, persists to DB, and returns the updated health status.
 * Returns null if the adapter name is not found.
 */
export async function refreshAdapter(adapterName: string): Promise<{ health: AdapterHealth; bikeCount: number } | null> {
  const adapter = adapters.find((a) => a.name === adapterName);
  if (!adapter) return null;

  const key = adapterCacheKey(adapter.name);
  cacheClear(key);

  try {
    const bikes = await adapter.fetchBikes();
    cacheSet(key, bikes, adapter.cacheTtlMs);
    if (bikes.length > 0) {
      persistBikes(bikes, adapter.name).catch((err) =>
        console.error(`[registry] DB persist failed for ${adapter.name}:`, err)
      );
    }
    return { health: adapter.getHealth(), bikeCount: bikes.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[registry] Refresh failed for ${adapter.name}:`, message);
    return { health: adapter.getHealth(), bikeCount: 0 };
  }
}
