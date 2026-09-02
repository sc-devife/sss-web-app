import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";
import { serverApi } from "@/lib/axios/serverClient";

export async function GET(_request: Request, { params }: { params: { uid: string } }) {
  const res = await backendFetch(`/api/quotation-templates/${params.uid}`);
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}

export async function PUT(request: Request, { params }: { params: { uid: string } }) {
  const formData = await request.formData();
  const res = await serverApi.putForm<string>(`/api/quotation-templates/${params.uid}`, formData);
  const body = res.data ? JSON.parse(res.data) : null;
  return NextResponse.json(body, { status: res.status });
}

export async function DELETE(_request: Request, { params }: { params: { uid: string } }) {
  const res = await backendFetch(`/api/quotation-templates/${params.uid}`, { method: "DELETE" });
  return new NextResponse(null, { status: res.status });
}
