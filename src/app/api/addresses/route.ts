import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(request: Request) {
  const { orgId, ...payload } = await request.json();

  const res = await backendFetch(`/api/addresses/${orgId}/create`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}

export async function PUT(request: Request) {
  const { orgId, addressId, ...payload } = await request.json();

  const res = await backendFetch(`/api/addresses/${orgId}/update/${addressId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}

export async function DELETE(request: Request) {
  const { orgId, addressId } = await request.json();

  const res = await backendFetch(`/api/addresses/${orgId}/address/${addressId}`, { method: "DELETE" });
  if (res.status === 204) return new NextResponse(null, { status: 204 });

  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
