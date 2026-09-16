import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(
  _request: Request,
  { params }: { params: { uid: string; itineraryItemUid: string } },
) {
  const res = await backendFetch(
    `/api/v1/hotels/${params.uid}/bookings/${params.itineraryItemUid}/booking-email-preview`,
  );
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
