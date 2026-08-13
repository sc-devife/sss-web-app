import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";
import { resolveLocationLabel } from "@/lib/reference-data";

export async function GET(_request: Request, { params }: { params: { uid: string } }) {
  const res = await backendFetch(`/escape/${params.uid}`);
  const body = await res.json().catch(() => null);
  // Resolved here (server-side route handler) rather than client-side —
  // reference-data.ts's resolvers are server-only, see its guard comment.
  if (body?.escapePoints) {
    body.escapePoints = body.escapePoints.map((ep: Record<string, unknown>) => ({
      ...ep,
      locationLabel: resolveLocationLabel(ep as { countryCode: string | null; regionCode: string | null; cityCode: string | null }),
    }));
  }
  return NextResponse.json(body, { status: res.status });
}

export async function PUT(request: Request, { params }: { params: { uid: string } }) {
  const payload = await request.json();
  const res = await backendFetch(`/escape/update/${params.uid}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
