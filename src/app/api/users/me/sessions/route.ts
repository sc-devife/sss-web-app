import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET() {
  const res = await backendFetch("/users/me/sessions");
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
