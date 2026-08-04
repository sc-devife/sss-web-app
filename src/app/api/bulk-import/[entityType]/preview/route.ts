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

// Uses postForm (not backendFetch) for the same reason as /api/files/upload:
// FormData needs axios's own multipart boundary handling, which a forced
// JSON Content-Type would break.
export async function POST(request: Request, { params }: { params: { entityType: string } }) {
  const formData = await request.formData();

  const res = await serverApi.postForm<string>(`/api/bulk-import/${params.entityType}/preview`, formData);

  const body = parseJson(res.data);
  return NextResponse.json(body, { status: res.status });
}
