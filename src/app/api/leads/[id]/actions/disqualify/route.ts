import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const payload = await request.json();
  const res = await backendFetch(`/leads/${params.id}/actions/disqualify`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
