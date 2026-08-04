import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(_request: Request, { params }: { params: { channelCode: string } }) {
  const res = await backendFetch(`/api/lead-sources/${params.channelCode}/webhook-events`);
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
