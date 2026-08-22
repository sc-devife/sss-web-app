import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(_request: Request, { params }: { params: { uid: string } }) {
  const res = await backendFetch(`/api/payment-milestones/${params.uid}/verify`, {
    method: "POST",
  });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
