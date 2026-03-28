import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const UpdateNoteRequest = z.object({
  note: z.string().max(2000).nullable(),
});

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const { id } = await params;

  const savedBike = await db.savedBike.findUnique({ where: { id } });
  if (!savedBike) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  if (savedBike.userId !== session.user.id) {
    return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
  }

  await db.savedBike.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const { id } = await params;

  const savedBike = await db.savedBike.findUnique({ where: { id } });
  if (!savedBike) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  if (savedBike.userId !== session.user.id) {
    return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungueltiger Request-Body" }, { status: 400 });
  }

  const parsed = UpdateNoteRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungueltige Daten", details: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await db.savedBike.update({
    where: { id },
    data: { note: parsed.data.note },
  });

  return NextResponse.json({ savedBike: updated });
}
