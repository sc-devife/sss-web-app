import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET() {
  const res = await backendFetch("/api/v1/meal-plans");
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const res = await backendFetch("/api/v1/meal-plans", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
