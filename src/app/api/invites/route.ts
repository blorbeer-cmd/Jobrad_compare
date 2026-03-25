import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const createInviteSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
});

// POST /api/invites — Create a new invite (Admin only)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createInviteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email } = parsed.data;

  // Check if user already exists
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { error: "Benutzer existiert bereits" },
      { status: 409 }
    );
  }

  // Check if invite already exists
  const existingInvite = await db.invite.findUnique({ where: { email } });
  if (existingInvite) {
    return NextResponse.json(
      { error: "Einladung existiert bereits" },
      { status: 409 }
    );
  }

  // Create invite (valid for 7 days)
  const invite = await db.invite.create({
    data: {
      email,
      invitedBy: session.user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json(invite, { status: 201 });
}

// GET /api/invites — List all invites (Admin only)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const invites = await db.invite.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      sender: {
        select: { email: true, name: true },
      },
    },
  });

  return NextResponse.json(invites);
}
