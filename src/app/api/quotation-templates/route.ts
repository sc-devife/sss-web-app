import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";
import { serverApi } from "@/lib/axios/serverClient";

export async function GET() {
  const res = await backendFetch("/api/quotation-templates");
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}

// Multipart forward (name/description/file/previewImage) — same postForm
// pattern as /api/files/upload, since the backend endpoint itself is a
// multipart create.
export async function POST(request: Request) {
  const formData = await request.formData();
  const res = await serverApi.postForm<string>("/api/quotation-templates", formData);
  const body = res.data ? JSON.parse(res.data) : null;
  return NextResponse.json(body, { status: res.status });
}
