import { NextResponse } from "next/server";
import { serverApi } from "@/lib/axios/serverClient";

// Returns raw rendered HTML (not JSON) — the frontend displays it as-is
// inside an iframe, it never fetches/combines the template itself.
export async function GET(_request: Request, { params }: { params: { uid: string } }) {
  const res = await serverApi.get<string>(`/api/quotation-templates/${params.uid}/preview-sample`);
  return new NextResponse(res.data, { status: res.status, headers: { "Content-Type": "text/html" } });
}
