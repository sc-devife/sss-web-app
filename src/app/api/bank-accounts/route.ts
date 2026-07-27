import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(request: Request) {
  const { orgId, ...payload } = await request.json();

  const res = await backendFetch(`/api/bank-accounts/${orgId}/create`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}

export async function DELETE(request: Request) {
  const { orgId, accountId } = await request.json();

  const res = await backendFetch(`/api/bank-accounts/${orgId}/${accountId}`, { method: "DELETE" });
  if (res.status === 204) return new NextResponse(null, { status: 204 });

  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
