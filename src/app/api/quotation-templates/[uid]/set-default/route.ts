import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(_request: Request, { params }: { params: { uid: string } }) {
  const res = await backendFetch(`/api/quotation-templates/${params.uid}/set-default`, { method: "POST" });
  return new NextResponse(null, { status: res.status });
}
