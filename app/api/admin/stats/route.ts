import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { subDays } from "date-fns";

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const now = new Date();
  const weekAgo = subDays(now, 7);
  const monthAgo = subDays(now, 30);

  const [week, month, pending, confirmed] = await Promise.all([
    prisma.booking.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.booking.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
  ]);

  return NextResponse.json({ week, month, pending, confirmed });
}
