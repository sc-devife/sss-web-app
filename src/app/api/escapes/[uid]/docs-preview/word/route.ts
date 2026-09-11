import { NextResponse } from "next/server";
import { serverApi } from "@/lib/axios/serverClient";

// Same rendered Docs content as ../docs-preview, as a downloadable Word
// (.docx) document. responseType must be overridden to "arraybuffer" — see
// the PDF sibling route for why.
export async function GET(request: Request, { params }: { params: { uid: string } }) {
  const query = new URL(request.url).search;
  const res = await serverApi.get<ArrayBuffer>(`/escape/${params.uid}/docs-preview/word${query}`, {
    responseType: "arraybuffer",
  });
  return new NextResponse(res.data, {
    status: res.status,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": res.headers["content-disposition"] ?? `attachment; filename="escape-document.docx"`,
    },
  });
}
