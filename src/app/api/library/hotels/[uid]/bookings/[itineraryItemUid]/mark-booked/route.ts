import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(
  _request: Request,
  { params }: { params: { uid: string; itineraryItemUid: string } },
) {
  const res = await backendFetch(`/api/v1/hotels/${params.uid}/bookings/${params.itineraryItemUid}/mark-booked`, {
    method: "POST",
  });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
