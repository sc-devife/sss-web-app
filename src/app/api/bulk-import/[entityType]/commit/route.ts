import { NextResponse } from "next/server";
import { getSessionToken } from "@/lib/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/sss";

export async function POST(request: Request, { params }: { params: { entityType: string } }) {
  const formData = await request.formData();
  const token = getSessionToken();

  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}/api/bulk-import/${params.entityType}/commit`, {
    method: "POST",
    headers,
    body: formData,
  });

  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
