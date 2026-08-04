import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session";
import { serverApi } from "@/lib/axios/serverClient";

export async function POST() {
  // Best-effort: also invalidate the session server-side (serverApi's request
  // interceptor attaches the still-present session cookie as the bearer
  // token). Cookie clears below regardless of whether this call succeeds.
  await serverApi.get("/api/login/logout").catch(() => undefined);

  cookies().delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
