import { NextResponse } from "next/server";
import { getScheduleSettings } from "@/lib/schedule";

export async function GET() {
  const schedule = await getScheduleSettings();
  return NextResponse.json(schedule);
}
