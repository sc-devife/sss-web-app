import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, getSessionToken } from "@/lib/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/sss";

export async function POST() {
  const token = getSessionToken();

  if (token) {
    // Best-effort: also invalidate the session server-side. Cookie clears
    // regardless of whether this call succeeds.
    await fetch(`${API_BASE_URL}/api/login/logout`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => undefined);
  }

  cookies().delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
