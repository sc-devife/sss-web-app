import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function DELETE(_request: Request, { params }: { params: { sessionId: string } }) {
  const res = await backendFetch(`/users/me/sessions/${params.sessionId}`, { method: "DELETE" });
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
