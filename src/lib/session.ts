import { cookies } from "next/headers";

// Server-only. The JWT lives in an httpOnly cookie (set by our own
// /api/login route handler, never touched by client JS) rather than
// localStorage, so it works with middleware-based route protection and
// isn't exposed to XSS.
export const SESSION_COOKIE = "session_token";

export function getSessionToken(): string | undefined {
  return cookies().get(SESSION_COOKIE)?.value;
}
