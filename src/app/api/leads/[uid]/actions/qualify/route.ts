import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(_request: Request, { params }: { params: { uid: string } }) {
  const res = await backendFetch(`/leads/${params.uid}/actions/qualify`, { method: "POST" });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
