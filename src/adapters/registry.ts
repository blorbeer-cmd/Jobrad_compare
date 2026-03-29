import type { Bike, DealerAdapter, AdapterHealth } from "./types";
import { BaseAdapter } from "./base-adapter";
import { cacheGet, cacheSet } from "./cache";
import { DemoAdapter } from "./demo";
import { FahrradXXLAdapter } from "./fahrrad-xxl";
import { LuckyBikeAdapter } from "./lucky-bike";
import { BikeDiscountAdapter } from "./bike-discount";
import { RoseBikesAdapter } from "./rose-bikes";
import { Bike24Adapter } from "./bike24";
import { persistBikes, loadBikesFromDb } from "@/lib/bike-persistence";

const realAdapters: BaseAdapter[] = [
  new FahrradXXLAdapter(),
  new LuckyBikeAdapter(),
  new BikeDiscountAdapter(),
  new RoseBikesAdapter(),
  new Bike24Adapter(),
];

const demoAdapter = new DemoAdapter();

function getActiveAdapters(): BaseAdapter[] {
  const useDemo = process.env.USE_DEMO_ADAPTERS === "true";
  if (useDemo) return [demoAdapter];
  return realAdapters;
}

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
  const active = getActiveAdapters();
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
  return getActiveAdapters().map((a) => a.name);
}

export function getAdapterHealthStatuses(): AdapterHealth[] {
  return getActiveAdapters().map((a) => a.getHealth());
}
