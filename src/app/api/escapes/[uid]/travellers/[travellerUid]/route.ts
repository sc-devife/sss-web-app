import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

// Detaches the traveller from this escape only — see EscapeController's
// removeTraveller for why this isn't the same as DELETE /travellers/{uid}.
export async function DELETE(_request: Request, { params }: { params: { uid: string; travellerUid: string } }) {
  const res = await backendFetch(`/escape/${params.uid}/travellers/${params.travellerUid}`, { method: "DELETE" });
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
