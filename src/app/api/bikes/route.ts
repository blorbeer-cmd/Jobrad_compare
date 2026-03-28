import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchAllBikes } from "@/adapters/registry";
import { loadBikesFromDb } from "@/lib/bike-persistence";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  // On force-refresh, always fetch live from adapters (which also writes to DB)
  if (forceRefresh) {
    const result = await fetchAllBikes(true);
    return NextResponse.json(result);
  }

  // Try DB first — it holds persisted data that survives server restarts
  try {
    const dbBikes = await loadBikesFromDb();
    if (dbBikes.length > 0) {
      // Still trigger a background refresh via in-memory cache logic
      fetchAllBikes(false).catch(() => {/* background refresh, ignore errors */});
      return NextResponse.json({
        bikes: dbBikes,
        errors: [],
        fromCache: true,
        fromDb: true,
        fetchedAt: dbBikes[0]?.lastSeenAt ?? new Date().toISOString(),
      });
    }
  } catch {
    // DB unavailable — fall through to in-memory cache / live fetch
  }

  // Fallback: in-memory cache + live adapter fetch
  const result = await fetchAllBikes(false);
  return NextResponse.json(result);
}
