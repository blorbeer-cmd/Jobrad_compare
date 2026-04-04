import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { refreshAdapter } from "@/adapters/registry";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const result = await refreshAdapter(decodedName);

  if (!result) {
    return NextResponse.json(
      { error: `Adapter "${decodedName}" nicht gefunden` },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}
