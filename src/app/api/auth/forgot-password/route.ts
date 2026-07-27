import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

// Backend returns a plain-text body here (not JSON), and always the same
// generic message regardless of whether the email is registered.
export async function POST(request: Request) {
  const { email } = await request.json();

  const res = await backendFetch("/api/login/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

  const message = await res.text().catch(() => "");
  return NextResponse.json({ message }, { status: res.status });
}
