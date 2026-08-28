import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

// locations/locationLabel now come resolved directly from the backend (see
// EscapePointLocationResolver) — no client-side reference-data enrichment
// needed here anymore.
export async function GET() {
  const res = await backendFetch("/library/escapepoints/all");
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const res = await backendFetch("/library/escapepoints/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
