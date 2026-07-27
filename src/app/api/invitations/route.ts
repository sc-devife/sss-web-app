import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(request: Request) {
  const { email } = await request.json();

  const res = await backendFetch("/newuser/invite", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
