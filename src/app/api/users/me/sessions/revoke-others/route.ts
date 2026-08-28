import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST() {
  const res = await backendFetch("/users/me/sessions/revoke-others", { method: "POST" });
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
