import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

// locations/locationLabel on the nested escapePoints now come resolved
// directly from the backend (see EscapePointLocationResolver) — no
// client-side enrichment needed here anymore.
export async function GET(_request: Request, { params }: { params: { uid: string } }) {
  const res = await backendFetch(`/escape/${params.uid}`);
  const body = await res.json().catch(() => null);
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
