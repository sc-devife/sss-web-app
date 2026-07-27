import { NextResponse } from "next/server";
import { getRegionOptions } from "@/lib/reference-data";

export async function GET(request: Request) {
  const country = new URL(request.url).searchParams.get("country") ?? "";
  return NextResponse.json(getRegionOptions(country));
}
