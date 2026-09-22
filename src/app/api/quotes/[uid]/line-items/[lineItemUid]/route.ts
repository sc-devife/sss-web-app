import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function PUT(request: Request, { params }: { params: { uid: string; lineItemUid: string } }) {
  const payload = await request.json();
  const res = await backendFetch(`/api/quotes/${params.uid}/line-items/${params.lineItemUid}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
