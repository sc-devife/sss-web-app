import { NextResponse } from "next/server";
import { serverApi } from "@/lib/axios/serverClient";

// Emails the exact same watermarked PDF as ../pdf to the escape's lead +
// traveller addresses. templateUid is optional: omit to use the org's
// default billing template.
export async function POST(request: Request, { params }: { params: { uid: string } }) {
  const templateUid = new URL(request.url).searchParams.get("templateUid");
  const query = templateUid ? `?templateUid=${templateUid}` : "";
  const res = await serverApi.post<string>(`/escape/${params.uid}/invoice-preview/send-email${query}`);
  const body = res.data ? JSON.parse(res.data) : null;
  return NextResponse.json(body, { status: res.status });
}
