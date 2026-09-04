import { NextResponse } from "next/server";
import { serverApi } from "@/lib/axios/serverClient";

// Same rendered document as ../preview-sample, as a downloadable, watermarked
// PDF. responseType must be overridden to "arraybuffer" — the shared
// serverApi client defaults to "text", which would corrupt binary PDF bytes
// by decoding them as UTF-8.
export async function GET(_request: Request, { params }: { params: { uid: string } }) {
  const res = await serverApi.get<ArrayBuffer>(`/api/quotation-templates/${params.uid}/preview-sample/pdf`, {
    responseType: "arraybuffer",
  });
  // Filename ("template-preview.pdf") is decided backend-side, forwarded as-is.
  return new NextResponse(res.data, {
    status: res.status,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": res.headers["content-disposition"] ?? `attachment; filename="template-preview.pdf"`,
    },
  });
}
