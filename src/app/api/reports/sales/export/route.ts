import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

// CSV download of the currently selected Sales report. Same proxy shape as the
// bulk-import template download; backendFetch doesn't forward the backend's
// Content-Disposition, so the filename is rebuilt here from the same params.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const res = await backendFetch(`/api/reports/sales/export${url.search}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return NextResponse.json(body, { status: res.status });
  }
  const type = url.searchParams.get("type") ?? "report";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const filename = `sales-report-${type}${from ? `-${from}` : ""}${to && to !== from ? `-to-${to}` : ""}.csv`;
  return new NextResponse(await res.arrayBuffer(), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=UTF-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
