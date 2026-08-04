import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

// Same rationale as api/users/route.ts — no client-facing GET existed for the
// assignable-roles list before this migration.
export async function GET() {
  const res = await backendFetch("/roles");
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
