import { NextResponse } from "next/server";
import { getActiveTicker } from "@/lib/site-settings";

export async function GET() {
  const items = await getActiveTicker();
  return NextResponse.json(items);
}
