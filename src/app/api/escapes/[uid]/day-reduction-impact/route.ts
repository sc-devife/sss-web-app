import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(request: Request, { params }: { params: { uid: string } }) {
  const numberOfDays = new URL(request.url).searchParams.get("numberOfDays");
  const res = await backendFetch(`/escape/${params.uid}/day-reduction-impact?numberOfDays=${numberOfDays}`);
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
