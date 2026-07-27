import { NextResponse } from "next/server";
import { getCityOptions } from "@/lib/reference-data";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const country = params.get("country") ?? "";
  const region = params.get("region") ?? "";
  return NextResponse.json(getCityOptions(country, region));
}
