import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(request: Request, { params }: { params: { quoteUid: string } }) {
  const res = await backendFetch(`/api/deals/accept-quote/${params.quoteUid}`, {
    method: "POST",
  });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
