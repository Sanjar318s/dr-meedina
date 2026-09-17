import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createBooking } from "@/lib/booking/slots";
import { notifyAdmin } from "@/lib/telegram";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { studioConfig } from "@/lib/studio-config";

const schema = z.object({
  clientName: z.string().min(2).max(80),
  clientPhone: z.string().min(9).max(30),
  serviceId: z.string().min(1),
  masterId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const booking = await createBooking({ ...body, source: "SITE" });

    const local = toZonedTime(booking.startsAt, studioConfig.timezone);
    await notifyAdmin(
      `<b>Новая запись (сайт)</b>\n` +
        `${booking.clientName} · ${booking.clientPhone}\n` +
        `${booking.service.nameRu} · ${booking.master.name}\n` +
        `${format(local, "dd.MM.yyyy HH:mm")}`,
    );

    return NextResponse.json({ id: booking.id, status: booking.status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    const status =
      msg === "SLOT_UNAVAILABLE" || msg === "SLOT_CONFLICT" || msg === "SLOT_IN_PAST"
        ? 409
        : msg.includes("Invalid") || msg.includes("Validation")
          ? 400
          : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
