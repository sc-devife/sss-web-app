import { NextResponse } from "next/server";
import { getCountryOptions } from "@/lib/reference-data";

export async function GET() {
  return NextResponse.json(getCountryOptions());
}
