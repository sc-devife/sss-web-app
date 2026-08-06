import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";
import { resolveCountryLabel, resolveRegionLabel, resolveCityLabel } from "@/lib/reference-data";

// Mirrors src/lib/escape-points.ts's getEscapePoints() enrichment: the client
// Redux thunk can't import the "server-only" reference-data module directly,
// so this route computes locationLabel itself. getEscapePoints() and its
// underlying lib call stay untouched — other pages still use it as
// server-fetched reference data.
export async function GET() {
  const res = await backendFetch("/library/escapepoints/all");
  const body = await res.json().catch(() => null);
  const enriched = Array.isArray(body)
    ? body.map((d) => ({
        ...d,
        locationLabel: [resolveCityLabel(d.cityCode), resolveRegionLabel(d.countryCode, d.regionCode), resolveCountryLabel(d.countryCode)]
          .filter(Boolean)
          .join(", "),
      }))
    : body;
  return NextResponse.json(enriched, { status: res.status });
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
