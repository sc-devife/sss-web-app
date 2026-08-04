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

export async function POST(request: Request, { params }: { params: { entityType: string } }) {
  const formData = await request.formData();

  const res = await serverApi.postForm<string>(`/api/bulk-import/${params.entityType}/commit`, formData);

  const body = parseJson(res.data);
  return NextResponse.json(body, { status: res.status });
}
