import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(request: Request) {
  const period = new URL(request.url).searchParams.get("period") ?? "30d";
  const res = await backendFetch(`/api/dashboard/leads-trend?period=${period}`);
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
