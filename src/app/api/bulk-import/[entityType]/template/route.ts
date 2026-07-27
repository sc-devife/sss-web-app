import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(_request: Request, { params }: { params: { entityType: string } }) {
  const res = await backendFetch(`/api/bulk-import/${params.entityType}/template`);
  const buffer = await res.arrayBuffer();
  return new NextResponse(buffer, {
    status: res.status,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": res.headers.get("content-disposition") ?? `attachment; filename="${params.entityType}-template.csv"`,
    },
  });
}
