import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// DELETE /api/account — Delete account and all user data (GDPR Art. 17)
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const userId = session.user.id;

  // Cascade delete handles savedBikes, accounts, sessions via Prisma schema
  await db.user.delete({ where: { id: userId } });

  return NextResponse.json({ success: true });
}
