import { NextResponse } from "next/server";
import { serverApi } from "@/lib/axios/serverClient";

// Same rendered Docs content as ../docs-preview, as a downloadable PDF.
// responseType must be overridden to "arraybuffer" — the shared serverApi
// client defaults to "text", which would corrupt binary PDF bytes.
export async function GET(request: Request, { params }: { params: { uid: string } }) {
  const query = new URL(request.url).search;
  const res = await serverApi.get<ArrayBuffer>(`/escape/${params.uid}/docs-preview/pdf${query}`, {
    responseType: "arraybuffer",
  });
  return new NextResponse(res.data, {
    status: res.status,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": res.headers["content-disposition"] ?? `attachment; filename="escape-document.pdf"`,
    },
  });
}
