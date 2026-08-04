import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(_request: Request, { params }: { params: { orgId: string } }) {
  const res = await backendFetch(`/api/addresses/${params.orgId}`);
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
