import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function PATCH(_request: Request, { params }: { params: { uid: string } }) {
  const res = await backendFetch(`/api/v1/inclusion-exclusions/${params.uid}/deactivate`, { method: "PATCH" });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
