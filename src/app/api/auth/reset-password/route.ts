import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(request: Request) {
  const { email, token, newPassword } = await request.json();

  const res = await backendFetch("/api/login/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, token, newPassword }),
  });

  const message = await res.text().catch(() => "");
  return NextResponse.json({ message }, { status: res.status });
}
