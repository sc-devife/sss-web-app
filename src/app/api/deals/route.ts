import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(request: Request) {
  const tripId = new URL(request.url).searchParams.get("tripId");
  const res = await backendFetch(`/api/deals?tripId=${tripId}`);
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
