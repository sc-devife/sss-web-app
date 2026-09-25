import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET() {
  const res = await backendFetch("/api/exchange-rates/org");
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
