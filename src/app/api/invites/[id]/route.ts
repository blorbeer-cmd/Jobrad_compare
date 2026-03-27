import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// DELETE /api/invites/:id -- Revoke an invite (Admin only)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const invite = await db.invite.findUnique({ where: { id } });
  if (!invite) {
    return NextResponse.json(
      { error: "Einladung nicht gefunden" },
      { status: 404 }
    );
  }

  await db.invite.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
