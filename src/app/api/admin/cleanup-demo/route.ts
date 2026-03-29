import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * DELETE /api/admin/cleanup-demo
 *
 * Removes all data associated with the "Demo" dealer from the database.
 * This includes BikeListing, PriceSnapshot, BikeModel (if orphaned), and the Dealer itself.
 * Admin-only endpoint.
 */
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  try {
    // Find the demo dealer
    const demoDealer = await db.dealer.findUnique({
      where: { adapterKey: "demo" },
      select: { id: true },
    });

    if (!demoDealer) {
      return NextResponse.json({ message: "Kein Demo-Dealer gefunden", deleted: 0 });
    }

    // Find all listings for this dealer
    const listings = await db.bikeListing.findMany({
      where: { dealerId: demoDealer.id },
      select: { id: true, bikeModelId: true },
    });

    const listingIds = listings.map((l) => l.id);
    const bikeModelIds = [...new Set(listings.map((l) => l.bikeModelId))];

    // Delete in correct order (foreign key constraints)
    const snapshots = await db.priceSnapshot.deleteMany({
      where: { bikeListingId: { in: listingIds } },
    });

    const deletedListings = await db.bikeListing.deleteMany({
      where: { dealerId: demoDealer.id },
    });

    // Delete orphaned bike models (no remaining listings)
    let orphanedModels = 0;
    for (const modelId of bikeModelIds) {
      const remaining = await db.bikeListing.count({
        where: { bikeModelId: modelId },
      });
      if (remaining === 0) {
        await db.bikeModel.delete({ where: { id: modelId } });
        orphanedModels++;
      }
    }

    // Delete saved bikes referencing demo dealer
    const savedBikes = await db.savedBike.deleteMany({
      where: { dealer: "Demo" },
    });

    // Delete the dealer itself
    await db.dealer.delete({ where: { id: demoDealer.id } });

    return NextResponse.json({
      message: "Demo-Daten erfolgreich gelöscht",
      deleted: {
        snapshots: snapshots.count,
        listings: deletedListings.count,
        models: orphanedModels,
        savedBikes: savedBikes.count,
        dealer: 1,
      },
    });
  } catch (err) {
    console.error("[cleanup-demo] Error:", err);
    return NextResponse.json(
      { error: "Fehler beim Bereinigen der Demo-Daten" },
      { status: 500 }
    );
  }
}
