import { prisma } from "@/lib/prisma";
import { studioConfig } from "@/lib/studio-config";

export type ScheduleView = {
  workDays: number[];
  openHour: number;
  closeHour: number;
  slotStepMinutes: number;
  closedDates: string[];
};

const DEFAULT: ScheduleView = {
  workDays: [1, 2, 3, 4, 5, 6],
  openHour: studioConfig.openHour,
  closeHour: studioConfig.closeHour,
  slotStepMinutes: studioConfig.slotStepMinutes,
  closedDates: [],
};

function parseJsonArray<T>(raw: string | null | undefined, fallback: T[]): T[] {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

export async function getScheduleSettings(): Promise<ScheduleView> {
  try {
    const row = await prisma.scheduleSettings.findUnique({ where: { id: "default" } });
    if (!row) return DEFAULT;
    return {
      workDays: parseJsonArray<number>(row.workDays, DEFAULT.workDays),
      openHour: row.openHour,
      closeHour: row.closeHour,
      slotStepMinutes: row.slotStepMinutes,
      closedDates: parseJsonArray<string>(row.closedDates, []),
    };
  } catch {
    return DEFAULT;
  }
}

/** date-fns: Sunday=0 … Saturday=6 → our Mon=1 … Sun=7 */
export function toWorkDayNumber(jsDay: number): number {
  return jsDay === 0 ? 7 : jsDay;
}

export function isWorkingDay(dateStr: string, schedule: ScheduleView): boolean {
  if (schedule.closedDates.includes(dateStr)) return false;
  const d = new Date(dateStr + "T12:00:00");
  const wd = toWorkDayNumber(d.getDay());
  return schedule.workDays.includes(wd);
}
