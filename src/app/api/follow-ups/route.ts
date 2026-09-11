import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

// Passes every query param straight through (filter/search/page/size — see
// FollowUpController.getAll), same convention as app/api/leads/route.ts.
export async function GET(request: Request) {
  const qs = new URL(request.url).search;
  const res = await backendFetch(`/follow-ups${qs}`);
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
