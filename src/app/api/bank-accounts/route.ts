import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(request: Request) {
  const { orgId, ...payload } = await request.json();

  const res = await backendFetch(`/api/bank-accounts/${orgId}/create`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}

export async function PATCH(request: Request) {
  const { orgId, accountId, action } = await request.json();
  const path = action === "reactivate" ? "reactivate" : "deactivate";

  const res = await backendFetch(`/api/bank-accounts/${orgId}/${accountId}/${path}`, { method: "PATCH" });

  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
