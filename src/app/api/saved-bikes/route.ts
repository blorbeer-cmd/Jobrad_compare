import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { BikeSchema } from "@/adapters/types";

const SaveBikeRequest = z.object({
  bikeData: BikeSchema,
  note: z.string().max(2000).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const savedBikes = await db.savedBike.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ savedBikes });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungueltiger Request-Body" }, { status: 400 });
  }

  const parsed = SaveBikeRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungueltige Daten", details: parsed.error.flatten() }, { status: 400 });
  }

  const { bikeData, note } = parsed.data;

  // Check for duplicate (same user, same dealer+name)
  const existing = await db.savedBike.findFirst({
    where: {
      userId: session.user.id,
      dealer: bikeData.dealer,
      bikeData: { path: ["name"], equals: bikeData.name },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "Fahrrad bereits gespeichert", savedBike: existing }, { status: 409 });
  }

  const savedBike = await db.savedBike.create({
    data: {
      userId: session.user.id,
      bikeData: JSON.parse(JSON.stringify(bikeData)),
      dealer: bikeData.dealer,
      note: note ?? null,
    },
  });

  return NextResponse.json({ savedBike }, { status: 201 });
}
