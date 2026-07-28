import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const res = await backendFetch(`/escape/${params.id}/audit-log`);
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
