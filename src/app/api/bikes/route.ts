import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchAllBikes } from "@/adapters/registry";
import { loadBikesFromDb } from "@/lib/bike-persistence";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const rawLimit = parseInt(searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE;
  const limit = Math.min(Math.max(1, rawLimit), MAX_PAGE_SIZE);
  return { page, limit };
}

function paginate<T>(items: T[], page: number, limit: number) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const clampedPage = Math.min(page, totalPages);
  const offset = (clampedPage - 1) * limit;
  return {
    items: items.slice(offset, offset + limit),
    pagination: {
      page: clampedPage,
      limit,
      totalItems,
      totalPages,
      hasNextPage: clampedPage < totalPages,
      hasPreviousPage: clampedPage > 1,
    },
  };
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";
  const { page, limit } = parsePagination(searchParams);

  // On force-refresh, always fetch live from adapters (which also writes to DB)
  if (forceRefresh) {
    const result = await fetchAllBikes(true);
    const { items, pagination } = paginate(result.bikes ?? [], page, limit);
    return NextResponse.json({ ...result, bikes: items, pagination });
  }

  // Try DB first — it holds persisted data that survives server restarts
  try {
    const dbBikes = await loadBikesFromDb();
    if (dbBikes.length > 0) {
      // Still trigger a background refresh via in-memory cache logic
      fetchAllBikes(false).catch(() => {/* background refresh, ignore errors */});
      const { items, pagination } = paginate(dbBikes, page, limit);
      return NextResponse.json({
        bikes: items,
        errors: [],
        fromCache: true,
        fromDb: true,
        fetchedAt: dbBikes[0]?.lastSeenAt ?? new Date().toISOString(),
        pagination,
      });
    }
  } catch {
    // DB unavailable — fall through to in-memory cache / live fetch
  }

  // Fallback: in-memory cache + live adapter fetch
  const result = await fetchAllBikes(false);
  const { items, pagination } = paginate(result.bikes ?? [], page, limit);
  return NextResponse.json({ ...result, bikes: items, pagination });
}
