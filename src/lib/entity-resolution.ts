/**
 * Entity Resolution — groups flat Bike listings into canonical model groups.
 *
 * The primary key is canonicalKey = "brand-slug:model-name-slug". Two listings
 * share a group when their canonicalKey is identical (exact match) or when the
 * Levenshtein distance between their slugged names is within a configurable
 * threshold (fuzzy match). Fuzzy matches are flagged with confidence "fuzzy"
 * so an admin can review uncertain groupings.
 *
 * Design notes:
 * - Pure function, no DB access — works on the Bike[] returned by /api/bikes
 * - Exact matching is the default; fuzzy is opt-in and tolerance is low (≤2)
 * - Within a group, the listing with the lowest price is marked as bestOffer
 */

import type { Bike } from "@/adapters/types";

export type MatchConfidence = "exact" | "fuzzy";

export interface BikeGroupListing extends Bike {
  isBestOffer: boolean;
  savings: number | null; // absolute saving vs highest price in group, or null if only 1 listing
}

export interface BikeGroup {
  canonicalKey: string;
  /** Display name — taken from the listing with the most common name in the group */
  name: string;
  brand: string;
  category: Bike["category"];
  listings: BikeGroupListing[];
  /** Lowest price across all dealers */
  bestPrice: number;
  /** Highest price across all dealers */
  highestPrice: number;
  /** Number of distinct dealers offering this model */
  dealerCount: number;
  /** How confidently these listings were matched */
  confidence: MatchConfidence;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Produce a stable, normalized slug for a string.
 * Mirrors the logic in bike-persistence.ts so keys are consistent.
 */
function slug(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function toCanonicalKey(brand: string, modelName: string): string {
  return `${slug(brand)}:${slug(modelName)}`;
}

/**
 * Levenshtein distance between two strings (iterative, O(m·n)).
 * Used for fuzzy matching of canonicalKeys.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] =
        a[i - 1] === b[j - 1]
          ? prev
          : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[n];
}

/**
 * Pick the most frequent name in a listing group (ties: first occurrence wins).
 */
function pickRepresentativeName(bikes: Bike[]): string {
  const counts = new Map<string, number>();
  for (const b of bikes) {
    counts.set(b.name, (counts.get(b.name) ?? 0) + 1);
  }
  let best = bikes[0].name;
  let bestCount = 0;
  for (const [name, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      best = name;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Core grouping algorithm
// ---------------------------------------------------------------------------

export interface GroupBikesOptions {
  /**
   * When true, listings whose canonicalKeys are within `fuzzyTolerance`
   * Levenshtein distance are merged into the same group.
   * Default: true
   */
  enableFuzzy?: boolean;
  /**
   * Maximum Levenshtein distance between two canonicalKeys to be considered
   * the same model. Only used when enableFuzzy is true.
   * Default: 2
   */
  fuzzyTolerance?: number;
}

/**
 * Group a flat array of Bike listings into BikeGroup objects.
 *
 * Algorithm:
 * 1. Exact pass: collect all bikes per canonicalKey
 * 2. Fuzzy pass (optional): merge groups whose keys are "close enough"
 * 3. Build BikeGroup metadata (bestPrice, dealerCount, isBestOffer, etc.)
 */
export function groupBikes(
  bikes: Bike[],
  options: GroupBikesOptions = {}
): BikeGroup[] {
  const { enableFuzzy = true, fuzzyTolerance = 2 } = options;

  // Step 1 — exact grouping by canonicalKey
  const exactMap = new Map<string, Bike[]>();
  for (const bike of bikes) {
    const key = toCanonicalKey(bike.brand, bike.name);
    const group = exactMap.get(key);
    if (group) {
      group.push(bike);
    } else {
      exactMap.set(key, [bike]);
    }
  }

  // Step 2 — fuzzy merging
  const keys = [...exactMap.keys()];
  // Union-find parent array (by index into keys[])
  const parent: number[] = keys.map((_, i) => i);

  function find(i: number): number {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  }

  function union(i: number, j: number) {
    parent[find(i)] = find(j);
  }

  if (enableFuzzy) {
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        if (find(i) !== find(j) && levenshtein(keys[i], keys[j]) <= fuzzyTolerance) {
          union(i, j);
        }
      }
    }
  }

  // Step 3 — collect merged groups
  const mergedMap = new Map<number, { keys: string[]; bikes: Bike[] }>();
  for (let i = 0; i < keys.length; i++) {
    const root = find(i);
    const entry = mergedMap.get(root);
    const keyBikes = exactMap.get(keys[i])!;
    if (entry) {
      entry.keys.push(keys[i]);
      entry.bikes.push(...keyBikes);
    } else {
      mergedMap.set(root, { keys: [keys[i]], bikes: [...keyBikes] });
    }
  }

  // Step 4 — build BikeGroup objects
  const groups: BikeGroup[] = [];

  for (const [, { keys: groupKeys, bikes: groupBikes }] of mergedMap) {
    const confidence: MatchConfidence = groupKeys.length > 1 ? "fuzzy" : "exact";
    // Use the most common canonicalKey as the group's canonical key
    const canonicalKey = groupKeys[0];

    const prices = groupBikes.map((b) => b.price);
    const bestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);
    const savings = groupBikes.length > 1 ? highestPrice - bestPrice : null;

    const listings: BikeGroupListing[] = groupBikes.map((b) => ({
      ...b,
      isBestOffer: b.price === bestPrice,
      savings: b.price === highestPrice && savings !== null ? savings : null,
    }));

    // Sort listings: cheapest first
    listings.sort((a, b) => a.price - b.price);

    const dealerCount = new Set(groupBikes.map((b) => b.dealer)).size;

    groups.push({
      canonicalKey,
      name: pickRepresentativeName(groupBikes),
      brand: groupBikes[0].brand,
      category: groupBikes[0].category,
      listings,
      bestPrice,
      highestPrice,
      dealerCount,
      confidence,
    });
  }

  // Sort groups: multi-dealer first (most interesting), then by name
  groups.sort((a, b) => {
    if (b.dealerCount !== a.dealerCount) return b.dealerCount - a.dealerCount;
    return a.name.localeCompare(b.name);
  });

  return groups;
}

/**
 * Filter groups that are available at more than one dealer — the "real"
 * comparison use case.
 */
export function getMultiDealerGroups(groups: BikeGroup[]): BikeGroup[] {
  return groups.filter((g) => g.dealerCount > 1);
}

/**
 * Summarize how much can be saved across all multi-dealer groups.
 */
export interface ResolutionSummary {
  totalGroups: number;
  multiDealerGroups: number;
  totalListings: number;
  maxSavings: number | null;
}

export function summarizeResolution(groups: BikeGroup[]): ResolutionSummary {
  const multi = getMultiDealerGroups(groups);
  const maxSavings =
    multi.length > 0
      ? Math.max(...multi.map((g) => g.highestPrice - g.bestPrice))
      : null;

  return {
    totalGroups: groups.length,
    multiDealerGroups: multi.length,
    totalListings: groups.reduce((sum, g) => sum + g.listings.length, 0),
    maxSavings,
  };
}
