import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

// PUT proxy for updating the caller's own organization. The backend resolves
// which org via /organizations/mine for the uid, so this route just forwards
// the uid + payload it's given.
export async function PUT(request: Request) {
  const { uid, ...payload } = await request.json();

  const res = await backendFetch(`/organizations/${uid}/update`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
