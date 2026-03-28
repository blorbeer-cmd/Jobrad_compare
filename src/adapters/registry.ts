import type { Bike, DealerAdapter, AdapterHealth } from "./types";
import { BaseAdapter } from "./base-adapter";
import { cacheGet, cacheSet } from "./cache";
import { FahrradXXLAdapter } from "./fahrrad-xxl";
import { LuckyBikeAdapter } from "./lucky-bike";
import { BikeDiscountAdapter } from "./bike-discount";
import { persistBikes, loadBikesFromDb } from "@/lib/bike-persistence";

const adapters: BaseAdapter[] = [
  new FahrradXXLAdapter(),
  new LuckyBikeAdapter(),
  new BikeDiscountAdapter(),
];

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
