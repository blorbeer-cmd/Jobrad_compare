/**
 * Simple in-memory sliding window rate limiter.
 *
 * Suitable for single-process deployments (Docker/standalone).
 * For multi-instance deployments, replace the store with Redis.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

/** Remove entries older than the window to prevent memory growth. */
function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < 60 * 60 * 1000);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

// Run cleanup every 10 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanup, 10 * 60 * 1000);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix ms when the oldest request falls out of window
}

/**
 * Check if a request is allowed under the rate limit.
 *
 * @param key     Identifier (e.g. IP address, user ID)
 * @param limit   Max requests allowed in the window
 * @param windowMs  Window size in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key) ?? { timestamps: [] };

  // Prune timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldest + windowMs,
    };
  }

  entry.timestamps.push(now);
  store.set(key, entry);

  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    resetAt: now + windowMs,
  };
}

/** Preset: 10 magic-link requests per 15 minutes per IP */
export const authRateLimit = (ip: string) =>
  checkRateLimit(`auth:${ip}`, 10, 15 * 60 * 1000);

/** Preset: 60 API requests per minute per user/IP */
export const apiRateLimit = (key: string) =>
  checkRateLimit(`api:${key}`, 60, 60 * 1000);

/** Preset: 30 save/mutation requests per minute per user */
export const mutationRateLimit = (userId: string) =>
  checkRateLimit(`mut:${userId}`, 30, 60 * 1000);
