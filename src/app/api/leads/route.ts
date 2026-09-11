import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

// Passes every query param straight through (search/status/from/to/page/
// size — see LeadController.getAllLeads) rather than picking each one out by
// name, so the backend stays the single source of truth for which filters
// exist.
export async function GET(request: Request) {
  const qs = new URL(request.url).search;
  const res = await backendFetch(`/leads${qs}`);
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const res = await backendFetch("/leads/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
