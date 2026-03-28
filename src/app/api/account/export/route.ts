import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/account/export — Export all user data as JSON (GDPR Art. 20)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const userId = session.user.id;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      consentGiven: true,
      consentAt: true,
    },
  });

  const savedBikes = await db.savedBike.findMany({
    where: { userId },
    select: {
      id: true,
      bikeData: true,
      dealer: true,
      note: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: user,
    savedBikes,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="meine-daten-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
