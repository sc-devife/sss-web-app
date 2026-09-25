import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const res = await backendFetch(
    `/api/exchange-rates?from=${searchParams.get("from") ?? ""}&to=${searchParams.get("to") ?? ""}`,
  );
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
