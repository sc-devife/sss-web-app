import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(_request: Request, { params }: { params: { channelCode: string } }) {
  const res = await backendFetch(`/api/integrations/${params.channelCode}/disconnect`, { method: "POST" });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
