import { NextResponse } from "next/server";
import { serverApi } from "@/lib/axios/serverClient";

// Real Escape/Itinerary data rendered into the checkbox-selected Docs
// sections — raw HTML passthrough, same pattern as quotation-preview.
export async function GET(request: Request, { params }: { params: { uid: string } }) {
  const query = new URL(request.url).search;
  const res = await serverApi.get<string>(`/escape/${params.uid}/docs-preview${query}`);
  return new NextResponse(res.data, { status: res.status, headers: { "Content-Type": "text/html" } });
}
