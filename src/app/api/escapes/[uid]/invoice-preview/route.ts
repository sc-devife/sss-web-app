import { NextResponse } from "next/server";
import { serverApi } from "@/lib/axios/serverClient";

// Real Escape/Deal/Quote data rendered against the selected (or default)
// billing template — raw HTML passthrough, mirrors ../quotation-preview.
// templateUid is optional: omit to use the org's default billing template.
export async function GET(request: Request, { params }: { params: { uid: string } }) {
  const templateUid = new URL(request.url).searchParams.get("templateUid");
  const query = templateUid ? `?templateUid=${templateUid}` : "";
  const res = await serverApi.get<string>(`/escape/${params.uid}/invoice-preview${query}`);
  return new NextResponse(res.data, { status: res.status, headers: { "Content-Type": "text/html" } });
}
