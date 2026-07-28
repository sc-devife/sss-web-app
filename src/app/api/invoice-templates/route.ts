import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET() {
  const res = await backendFetch("/api/invoice-templates");
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
