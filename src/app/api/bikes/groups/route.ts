import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchAllBikes } from "@/adapters/registry";
import { loadBikesFromDb } from "@/lib/bike-persistence";
import { groupBikes, summarizeResolution } from "@/lib/entity-resolution";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";
  const fuzzy = searchParams.get("fuzzy") !== "false"; // default: true

  let bikes;

  if (forceRefresh) {
    const result = await fetchAllBikes(true);
    bikes = result.bikes;
  } else {
    try {
      const dbBikes = await loadBikesFromDb();
      if (dbBikes.length > 0) {
        bikes = dbBikes;
        fetchAllBikes(false).catch(() => {});
      } else {
        const result = await fetchAllBikes(false);
        bikes = result.bikes;
      }
    } catch {
      const result = await fetchAllBikes(false);
      bikes = result.bikes;
    }
  }

  const groups = groupBikes(bikes, { enableFuzzy: fuzzy });
  const summary = summarizeResolution(groups);

  return NextResponse.json({ groups, summary });
}
