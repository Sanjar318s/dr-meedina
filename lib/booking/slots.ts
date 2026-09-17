import {
  addMinutes,
  format,
  isBefore,
  parse,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { studioConfig } from "../studio-config";

const ACTIVE: BookingStatus[] = [BookingStatus.PENDING, BookingStatus.CONFIRMED];

function dayBoundsInTz(dateStr: string) {
  const tz = studioConfig.timezone;
  const localMidnight = parse(dateStr, "yyyy-MM-dd", new Date());
  const startLocal = setMilliseconds(
    setSeconds(setMinutes(setHours(localMidnight, 0), 0), 0),
    0,
  );
  const endLocal = setMilliseconds(
    setSeconds(setMinutes(setHours(localMidnight, 23), 59), 59),
    999,
  );
  return {
    startUtc: fromZonedTime(startLocal, tz),
    endUtc: fromZonedTime(endLocal, tz),
  };
}

export function buildCandidateSlots(dateStr: string, durationMinutes: number): Date[] {
  const tz = studioConfig.timezone;
  const localDay = parse(dateStr, "yyyy-MM-dd", new Date());
  const slots: Date[] = [];
  let cursor = setMilliseconds(
    setSeconds(
      setMinutes(setHours(localDay, studioConfig.openHour), 0),
      0,
    ),
    0,
  );
  const close = setMilliseconds(
    setSeconds(
      setMinutes(setHours(localDay, studioConfig.closeHour), 0),
      0,
    ),
    0,
  );

  while (true) {
    const end = addMinutes(cursor, durationMinutes);
    if (isBefore(end, close) || +end === +close) {
      slots.push(fromZonedTime(cursor, tz));
      cursor = addMinutes(cursor, studioConfig.slotStepMinutes);
    } else {
      break;
    }
  }
  return slots;
}

function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export async function getAvailableSlots(params: {
  masterId: string;
  date: string;
  serviceId: string;
}): Promise<string[]> {
  const service = await prisma.service.findFirst({
    where: { id: params.serviceId, isActive: true },
  });
  if (!service) return [];

  const { startUtc, endUtc } = dayBoundsInTz(params.date);
  const bookings = await prisma.booking.findMany({
    where: {
      masterId: params.masterId,
      status: { in: ACTIVE },
      startsAt: { lt: endUtc },
      endsAt: { gt: startUtc },
    },
  });

  const now = new Date();
  const candidates = buildCandidateSlots(params.date, service.durationMinutes);
  const free = candidates.filter((start) => {
    if (start <= now) return false;
    const end = addMinutes(start, service.durationMinutes);
    return !bookings.some((b) => overlaps(start, end, b.startsAt, b.endsAt));
  });

  return free.map((d) => {
    const local = toZonedTime(d, studioConfig.timezone);
    return format(local, "HH:mm");
  });
}

export type CreateBookingInput = {
  clientName: string;
  clientPhone: string;
  clientTelegramId?: string | null;
  serviceId: string;
  masterId: string;
  date: string;
  time: string;
  source: "SITE" | "BOT";
};

export async function createBooking(input: CreateBookingInput) {
  const [service, master] = await Promise.all([
    prisma.service.findFirst({ where: { id: input.serviceId, isActive: true } }),
    prisma.master.findFirst({ where: { id: input.masterId, isActive: true } }),
  ]);
  if (!service) throw new Error("SERVICE_NOT_FOUND");
  if (!master) throw new Error("MASTER_NOT_FOUND");

  const localStart = parse(
    `${input.date} ${input.time}`,
    "yyyy-MM-dd HH:mm",
    new Date(),
  );
  const startsAt = fromZonedTime(localStart, studioConfig.timezone);
  const endsAt = addMinutes(startsAt, service.durationMinutes);

  if (startsAt <= new Date()) throw new Error("SLOT_IN_PAST");

  const available = await getAvailableSlots({
    masterId: input.masterId,
    date: input.date,
    serviceId: input.serviceId,
  });
  if (!available.includes(input.time)) throw new Error("SLOT_UNAVAILABLE");

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const conflict = await tx.booking.findFirst({
        where: {
          masterId: input.masterId,
          status: { in: ACTIVE },
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
        },
      });
      if (conflict) throw new Error("SLOT_CONFLICT");

      return tx.booking.create({
        data: {
          clientName: input.clientName,
          clientPhone: input.clientPhone,
          clientTelegramId: input.clientTelegramId || null,
          serviceId: input.serviceId,
          masterId: input.masterId,
          startsAt,
          endsAt,
          status: "PENDING",
          source: input.source,
        },
        include: { service: true, master: true },
      });
    });
    return booking;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Error("SLOT_CONFLICT");
    }
    throw e;
  }
}

export async function cancelBooking(id: string, telegramId?: string) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new Error("NOT_FOUND");
  if (telegramId && booking.clientTelegramId !== telegramId) {
    throw new Error("FORBIDDEN");
  }
  if (booking.status === "CANCELLED") return booking;
  return prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: { service: true, master: true },
  });
}
