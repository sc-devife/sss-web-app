import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function PATCH(_request: Request, { params }: { params: { uid: string } }) {
  const res = await backendFetch(`/notifications/${params.uid}/read`, { method: "PATCH" });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
