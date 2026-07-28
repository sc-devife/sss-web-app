import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const itineraryUid = params.get("itineraryUid");
  const type = params.get("type");
  const res = await backendFetch(`/api/v1/inclusion-exclusions/selectable?itineraryUid=${itineraryUid}&type=${type}`);
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
