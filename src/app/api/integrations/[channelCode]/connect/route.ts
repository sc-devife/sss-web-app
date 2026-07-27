import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(request: Request, { params }: { params: { channelCode: string } }) {
  const payload = await request.json();
  const res = await backendFetch(`/api/integrations/${params.channelCode}/connect`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
