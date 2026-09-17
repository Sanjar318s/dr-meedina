import { NextRequest, NextResponse } from "next/server";
import { BookingSource, BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { z } from "zod";
import { addMinutes } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { parse } from "date-fns";
import { studioConfig } from "@/lib/studio-config";

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) return null;
  return session;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") as BookingStatus | null;
  const source = searchParams.get("source") as BookingSource | null;
  const date = searchParams.get("date");

  const where: {
    status?: BookingStatus;
    source?: BookingSource;
    startsAt?: { gte: Date; lt: Date };
  } = {};
  if (status) where.status = status;
  if (source) where.source = source;
  if (date) {
    const start = fromZonedTime(
      parse(`${date} 00:00`, "yyyy-MM-dd HH:mm", new Date()),
      studioConfig.timezone,
    );
    const end = fromZonedTime(
      parse(`${date} 23:59`, "yyyy-MM-dd HH:mm", new Date()),
      studioConfig.timezone,
    );
    where.startsAt = { gte: start, lt: addMinutes(end, 1) };
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: { service: true, master: true },
    orderBy: { startsAt: "desc" },
    take: 200,
  });
  return NextResponse.json(bookings);
}

const patchSchema = z.object({
  id: z.string(),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "SERVED"]).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  tgHidden: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const data = patchSchema.parse(await req.json());
  const existing = await prisma.booking.findUnique({
    where: { id: data.id },
    include: { service: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  let startsAt = existing.startsAt;
  let endsAt = existing.endsAt;
  if (data.date && data.time) {
    startsAt = fromZonedTime(
      parse(`${data.date} ${data.time}`, "yyyy-MM-dd HH:mm", new Date()),
      studioConfig.timezone,
    );
    endsAt = addMinutes(startsAt, existing.service.durationMinutes);
  }

  const booking = await prisma.booking.update({
    where: { id: data.id },
    data: {
      status: data.status,
      startsAt,
      endsAt,
      tgHidden: data.tgHidden,
      ...(data.status === "SERVED" ? { servedAt: new Date() } : {}),
    },
    include: { service: true, master: true },
  });
  return NextResponse.json(booking);
}
