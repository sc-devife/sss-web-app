import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(_request: Request, { params }: { params: { uid: string } }) {
  const res = await backendFetch(`/api/v1/activities/${params.uid}/payments`);
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}

export async function POST(request: Request, { params }: { params: { uid: string } }) {
  const payload = await request.json();
  const res = await backendFetch(`/api/v1/activities/${params.uid}/payments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
