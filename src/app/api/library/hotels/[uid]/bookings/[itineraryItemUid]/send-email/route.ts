import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(
  request: Request,
  { params }: { params: { uid: string; itineraryItemUid: string } },
) {
  const payload = await request.json().catch(() => null);
  const res = await backendFetch(`/api/v1/hotels/${params.uid}/bookings/${params.itineraryItemUid}/send-email`, {
    method: "POST",
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
