import { NextResponse } from "next/server";
import { getCurrencyOptions } from "@/lib/reference-data";

export async function GET() {
  return NextResponse.json(getCurrencyOptions());
}
