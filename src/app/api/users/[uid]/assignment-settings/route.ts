import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function PUT(request: Request, { params }: { params: { uid: string } }) {
  const payload = await request.json();

  const res = await backendFetch(`/users/${params.uid}/assignment-settings`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
