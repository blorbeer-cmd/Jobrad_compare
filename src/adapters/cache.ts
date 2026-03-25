interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL = 15 * 60 * 1000;

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function cacheSet<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function cacheClear(key?: string): void {
  if (key) store.delete(key); else store.clear();
}

export function cacheStats() {
  return { size: store.size, keys: [...store.keys()] };
}
