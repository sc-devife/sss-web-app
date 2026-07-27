import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET() {
  const res = await backendFetch("/leads");
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const res = await backendFetch("/leads/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
