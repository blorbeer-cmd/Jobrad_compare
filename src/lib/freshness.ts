/**
 * Human-readable data freshness helpers.
 */

export function formatDataAge(isoTimestamp: string): string {
  const fetchedAt = new Date(isoTimestamp);
  const ageMs = Date.now() - fetchedAt.getTime();
  const ageMinutes = Math.floor(ageMs / 60_000);
  const ageHours = Math.floor(ageMs / 3_600_000);
  const ageDays = Math.floor(ageMs / 86_400_000);

  if (ageMinutes < 1) return "gerade eben";
  if (ageMinutes < 60) return `vor ${ageMinutes} Minute${ageMinutes !== 1 ? "n" : ""}`;
  if (ageHours < 24) return `vor ${ageHours} Stunde${ageHours !== 1 ? "n" : ""}`;
  return `vor ${ageDays} Tag${ageDays !== 1 ? "en" : ""}`;
}

export function isStale(isoTimestamp: string, maxAgeMs: number): boolean {
  return Date.now() - new Date(isoTimestamp).getTime() > maxAgeMs;
}
