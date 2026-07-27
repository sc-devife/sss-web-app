import { NextResponse } from "next/server";
import { getSessionToken } from "@/lib/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/sss";

// Deliberately bypasses backendFetch here: that helper force-sets
// Content-Type: application/json whenever a body is present and no header is
// set, which would strip the multipart boundary fetch generates for
// FormData. Uploads need the raw pass-through instead.
export async function POST(request: Request) {
  const formData = await request.formData();
  const token = getSessionToken();

  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}/api/files/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
