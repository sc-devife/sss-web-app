import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function PATCH() {
  const res = await backendFetch("/notifications/read-all", { method: "PATCH" });
  // Backend responds 204 No Content — NextResponse.json() throws on a 204
  // (a body is invalid for that status), so this bypasses it entirely,
  // same fix already applied to the Follow-up archive route.
  return new NextResponse(null, { status: res.status });
}
