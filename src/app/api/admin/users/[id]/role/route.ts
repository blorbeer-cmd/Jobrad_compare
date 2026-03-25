import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const roleSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  // Prevent self-demotion
  if (params.id === session.user.id) {
    return NextResponse.json(
      { error: "Du kannst deine eigene Rolle nicht aendern." },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungueltige Rolle" }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id: params.id },
    data: { role: parsed.data.role },
  });

  return NextResponse.json({ id: user.id, role: user.role });
}
