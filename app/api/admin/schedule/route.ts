import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  let row = await prisma.scheduleSettings.findUnique({ where: { id: "default" } });
  if (!row) {
    row = await prisma.scheduleSettings.create({ data: { id: "default" } });
  }
  return NextResponse.json(row);
}

const schema = z.object({
  workDays: z.array(z.number().int().min(1).max(7)),
  openHour: z.number().int().min(0).max(23),
  closeHour: z.number().int().min(1).max(24),
  slotStepMinutes: z.number().int().min(5).max(120),
  closedDates: z.array(z.string()),
});

export async function PUT(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const data = schema.parse(await req.json());
  const row = await prisma.scheduleSettings.upsert({
    where: { id: "default" },
    update: {
      workDays: JSON.stringify(data.workDays),
      openHour: data.openHour,
      closeHour: data.closeHour,
      slotStepMinutes: data.slotStepMinutes,
      closedDates: JSON.stringify(data.closedDates),
    },
    create: {
      id: "default",
      workDays: JSON.stringify(data.workDays),
      openHour: data.openHour,
      closeHour: data.closeHour,
      slotStepMinutes: data.slotStepMinutes,
      closedDates: JSON.stringify(data.closedDates),
    },
  });
  return NextResponse.json(row);
}
