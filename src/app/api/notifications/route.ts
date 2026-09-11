import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(request: Request) {
  const qs = new URL(request.url).search;
  const res = await backendFetch(`/notifications${qs}`);
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
