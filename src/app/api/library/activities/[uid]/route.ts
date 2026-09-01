import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(_request: Request, { params }: { params: { uid: string } }) {
  const res = await backendFetch(`/api/v1/activities/${params.uid}`);
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}

export async function PUT(request: Request, { params }: { params: { uid: string } }) {
  const payload = await request.json();
  const res = await backendFetch(`/api/v1/activities/${params.uid}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}

export async function DELETE(_request: Request, { params }: { params: { uid: string } }) {
  const res = await backendFetch(`/api/v1/activities/${params.uid}`, { method: "DELETE" });
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
