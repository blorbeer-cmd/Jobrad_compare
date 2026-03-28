import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getClientIp(req);

  // Rate limit magic-link / sign-in endpoints (by IP)
  if (pathname.startsWith("/api/auth/signin") || pathname.includes("email/signin")) {
    const result = checkRateLimit(`auth:${ip}`, 10, 15 * 60 * 1000);
    if (!result.allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Zu viele Anfragen. Bitte warte kurz." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }
  }

  // Rate limit general API routes (by IP, generous limit)
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
    const result = checkRateLimit(`api:${ip}`, 120, 60 * 1000);
    if (!result.allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Zu viele Anfragen. Bitte warte kurz." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
