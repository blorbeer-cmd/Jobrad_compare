import type { Bike, DealerAdapter } from "./types";
import { cacheGet, cacheSet } from "./cache";
import { DemoAdapter } from "./demo";
import { FahrradXXLAdapter } from "./fahrrad-xxl";
import { LuckyBikeAdapter } from "./lucky-bike";
import { BikeDiscountAdapter } from "./bike-discount";

const adapters: DealerAdapter[] = [
  new FahrradXXLAdapter(),
  new LuckyBikeAdapter(),
  new BikeDiscountAdapter(),
];

const demoAdapter = new DemoAdapter();

function getActiveAdapters(): DealerAdapter[] {
  const useDemo = process.env.USE_DEMO_ADAPTERS === "true";
  if (useDemo) return [demoAdapter];
  return adapters;
}

export interface FetchResult {
  bikes: Bike[];
  errors: { dealer: string; error: string }[];
  fromCache: boolean;
  fetchedAt: string;
}

const CACHE_KEY = "all-bikes";

export async function fetchAllBikes(forceRefresh = false): Promise<FetchResult> {
  if (!forceRefresh) {
    const cached = cacheGet<FetchResult>(CACHE_KEY);
    if (cached) return { ...cached, fromCache: true };
  }

  const active = getActiveAdapters();
  const results = await Promise.allSettled(
    active.map(async (adapter) => {
      const bikes = await adapter.fetchBikes();
      return { dealer: adapter.name, bikes };
    })
  );

  const allBikes: Bike[] = [];
  const errors: { dealer: string; error: string }[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      allBikes.push(...result.value.bikes);
    } else {
      errors.push({
        dealer: active[i]?.name || "Unknown",
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  }

  const fetchResult: FetchResult = {
    bikes: allBikes,
    errors,
    fromCache: false,
    fetchedAt: new Date().toISOString(),
  };

  // Only cache if at least one adapter succeeded
  if (errors.length < active.length) {
    cacheSet(CACHE_KEY, fetchResult);
  }

  return fetchResult;
}

export function getAdapterNames(): string[] {
  return getActiveAdapters().map((a) => a.name);
}
