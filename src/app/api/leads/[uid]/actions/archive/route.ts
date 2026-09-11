import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(_request: Request, { params }: { params: { uid: string } }) {
  const res = await backendFetch(`/leads/${params.uid}/actions/archive`, { method: "POST" });
  // Unlike the other lead actions, archive responds 204 No Content (void) —
  // NextResponse.json() throws on a 204 (a body is invalid for that status),
  // so this bypasses it entirely instead of trying to attach a null body.
  return new NextResponse(null, { status: res.status });
}
