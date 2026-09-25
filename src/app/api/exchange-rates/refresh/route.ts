import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST() {
  const res = await backendFetch("/api/exchange-rates/refresh", { method: "POST" });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
