import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

// No client-facing GET existed here before this migration — see the
// equivalent comment in api/users/route.ts.
export async function GET() {
  const res = await backendFetch("/newuser/invite/pending");
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}

export async function POST(request: Request) {
  const { email, roles } = await request.json();

  const res = await backendFetch("/newuser/invite", {
    method: "POST",
    body: JSON.stringify({ email, roles }),
  });

  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
