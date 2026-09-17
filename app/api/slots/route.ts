import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/booking/slots";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const masterId = searchParams.get("masterId");
  const date = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");

  if (!masterId || !date || !serviceId) {
    return NextResponse.json({ error: "MISSING_PARAMS" }, { status: 400 });
  }

  const slots = await getAvailableSlots({ masterId, date, serviceId });
  return NextResponse.json({ slots });
}
