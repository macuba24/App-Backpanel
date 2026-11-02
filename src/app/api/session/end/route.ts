import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/session-token";

const expired = "Path=/; HttpOnly; SameSite=Lax; Max-Age=0";

/**
 * Drops a panel session that no longer matches a user.
 * Cookie writes are forbidden while a Server Component renders, so the panel
 * redirects here instead of clearing the cookie itself.
 */
export function GET(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "127.0.0.1:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const response = NextResponse.redirect(new URL("/login", `${proto}://${host}`));
  response.headers.append("Set-Cookie", `${SESSION_COOKIE}=; ${expired}`);
  response.headers.append("Set-Cookie", `${SESSION_COOKIE}=; ${expired}; Secure`);
  return response;
}
