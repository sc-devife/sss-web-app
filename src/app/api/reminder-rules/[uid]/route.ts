import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function DELETE(request: Request, { params }: { params: { uid: string } }) {
  const res = await backendFetch(`/api/reminder-rules/${params.uid}`, { method: "DELETE" });
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
