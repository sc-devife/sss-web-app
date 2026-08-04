import { NextResponse } from "next/server";
import { serverApi } from "@/lib/axios/serverClient";

function parseJson(text: string | undefined | null) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Uses axios's postForm rather than a plain .post(): postForm serializes
// FormData and sets the multipart Content-Type/boundary correctly in both
// Node and browser adapters, which a manually-set Content-Type header would
// break (the boundary is generated per-request and must match the header).
export async function POST(request: Request) {
  const formData = await request.formData();

  const res = await serverApi.postForm<string>("/api/files/upload", formData);

  const body = parseJson(res.data);
  return NextResponse.json(body, { status: res.status });
}
