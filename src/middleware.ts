import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

// Route-level gate: redirects based on cookie presence only (no signature
// verification here — middleware runs on the Edge runtime, and the actual
// security boundary is the backend, which verifies the JWT signature and
// session on every request regardless). This is a UX guard, not the
// authorization check.
const PUBLIC_PATHS = ["/", "/login", "/forgot-password", "/reset-password", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!hasSession && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Deliberately no "cookie present -> bounce away from /login" rule here.
  // backendJson() redirects to /login on a 401 from a stale/expired cookie,
  // but a Server Component render can't clear that cookie (cookies() is
  // read-only outside Server Actions/Route Handlers) — so if this middleware
  // ever redirected an authenticated-looking-but-stale visitor straight back
  // to a protected page, it would ping-pong with backendJson forever. Letting
  // /login render even with a cookie present breaks that loop; the login
  // page itself is harmless to see again.

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
