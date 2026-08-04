import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";
import { resolveCountryLabel } from "@/lib/reference-data";

// Mirrors src/lib/service-providers.ts's getServiceProviders() enrichment —
// see the equivalent comment in api/library/destinations/route.ts.
export async function GET() {
  const res = await backendFetch("/api/v1/service-providers");
  const body = await res.json().catch(() => null);
  const enriched = Array.isArray(body)
    ? body.map((p) => ({ ...p, countryLabel: resolveCountryLabel(p.countryCode) }))
    : body;
  return NextResponse.json(enriched, { status: res.status });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const res = await backendFetch("/api/v1/service-providers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
