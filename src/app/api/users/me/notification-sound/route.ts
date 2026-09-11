import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function PATCH(request: Request) {
  const payload = await request.json();
  const res = await backendFetch("/users/me/notification-sound", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
