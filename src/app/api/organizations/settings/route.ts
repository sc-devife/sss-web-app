import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET() {
  const res = await backendFetch("/organizations/settings");
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}

export async function PUT(request: Request) {
  const payload = await request.json();
  const res = await backendFetch("/organizations/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
