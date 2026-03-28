import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const checks: Record<string, string> = {
    DATABASE_URL: process.env.DATABASE_URL ? "set" : "MISSING",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "set" : "MISSING",
    ALLOW_DEV_LOGIN: process.env.ALLOW_DEV_LOGIN || "not set",
    ADMIN_EMAIL: process.env.ADMIN_EMAIL ? "set" : "not set",
  };

  try {
    // Test DB connection by counting users
    const userCount = await db.user.count();
    checks.database = `connected (${userCount} users)`;
  } catch (error) {
    checks.database = `ERROR: ${error instanceof Error ? error.message : String(error)}`;
  }

  const allGood = checks.DATABASE_URL === "set"
    && checks.NEXTAUTH_SECRET === "set"
    && checks.database.startsWith("connected");

  return NextResponse.json({
    status: allGood ? "ok" : "issues",
    checks,
  }, { status: allGood ? 200 : 503 });
}
