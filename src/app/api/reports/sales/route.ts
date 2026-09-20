import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

// Passes type/from/to straight through — the backend owns which reports and
// filters exist (see ReportController).
export async function GET(request: Request) {
  const qs = new URL(request.url).search;
  const res = await backendFetch(`/api/reports/sales${qs}`);
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
