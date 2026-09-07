import { NextResponse } from "next/server";
import { serverApi } from "@/lib/axios/serverClient";

// Same rendered document as ../invoice-preview, as a downloadable,
// watermarked PDF. responseType must be overridden to "arraybuffer" — the
// shared serverApi client defaults to "text", which would corrupt binary
// PDF bytes by decoding them as UTF-8.
export async function GET(request: Request, { params }: { params: { uid: string } }) {
  const templateUid = new URL(request.url).searchParams.get("templateUid");
  const query = templateUid ? `?templateUid=${templateUid}` : "";
  const res = await serverApi.get<ArrayBuffer>(`/escape/${params.uid}/invoice-preview/pdf${query}`, {
    responseType: "arraybuffer",
  });
  // Filename (e.g. "INV-TRP-000123.pdf") is decided backend-side — it's the
  // only place that knows the invoice number — so forward its
  // Content-Disposition rather than inventing one.
  return new NextResponse(res.data, {
    status: res.status,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": res.headers["content-disposition"] ?? `attachment; filename="invoice.pdf"`,
    },
  });
}
