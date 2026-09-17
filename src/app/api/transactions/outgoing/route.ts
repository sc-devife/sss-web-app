import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(request: Request) {
  const escapeUid = new URL(request.url).searchParams.get("escapeUid");
  const query = escapeUid ? `?escapeUid=${encodeURIComponent(escapeUid)}` : "";
  const res = await backendFetch(`/api/transactions/outgoing${query}`);
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
