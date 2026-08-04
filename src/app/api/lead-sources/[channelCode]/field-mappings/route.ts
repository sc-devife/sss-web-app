import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(_request: Request, { params }: { params: { channelCode: string } }) {
  const res = await backendFetch(`/api/lead-sources/${params.channelCode}/field-mappings`);
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}

export async function PUT(request: Request, { params }: { params: { channelCode: string } }) {
  const payload = await request.json();
  const res = await backendFetch(`/api/lead-sources/${params.channelCode}/field-mappings`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
