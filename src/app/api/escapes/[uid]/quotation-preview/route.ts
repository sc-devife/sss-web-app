import { NextResponse } from "next/server";
import { serverApi } from "@/lib/axios/serverClient";

// Real Escape/quotation data rendered against the selected (or default)
// template — raw HTML passthrough, same as preview-sample. templateUid is
// optional: omit to use the org's default quotation template.
export async function GET(request: Request, { params }: { params: { uid: string } }) {
  const templateUid = new URL(request.url).searchParams.get("templateUid");
  const query = templateUid ? `?templateUid=${templateUid}` : "";
  const res = await serverApi.get<string>(`/escape/${params.uid}/quotation-preview${query}`);
  return new NextResponse(res.data, { status: res.status, headers: { "Content-Type": "text/html" } });
}
