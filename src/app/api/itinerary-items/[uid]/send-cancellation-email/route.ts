import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(request: Request, { params }: { params: { uid: string } }) {
  const payload = await request.json().catch(() => null);
  const res = await backendFetch(`/api/itinerary-items/${params.uid}/send-cancellation-email`, {
    method: "POST",
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
