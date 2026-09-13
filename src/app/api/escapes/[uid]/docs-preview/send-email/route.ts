import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

// Emails the same rendered Docs content as ../docs-preview/pdf to the
// escape's primary traveller — see EscapeDocsServiceImpl.sendEmail.
export async function POST(request: Request, { params }: { params: { uid: string } }) {
  const query = new URL(request.url).search;
  const res = await backendFetch(`/escape/${params.uid}/docs-preview/send-email${query}`, { method: "POST" });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
