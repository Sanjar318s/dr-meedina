import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { broadcastNews } from "@/lib/bot-broadcast";

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [total, active, recent] = await Promise.all([
    prisma.botUser.count(),
    prisma.botUser.count({ where: { lastSeenAt: { gte: weekAgo } } }),
    prisma.botUser.findMany({
      orderBy: { lastSeenAt: "desc" },
      take: 30,
      include: {
        activities: { orderBy: { createdAt: "desc" }, take: 3 },
      },
    }),
  ]);
  return NextResponse.json({ total, active, users: recent });
}

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  if (body.action === "broadcast" && body.newsId) {
    const result = await broadcastNews(String(body.newsId));
    return NextResponse.json(result);
  }
  return NextResponse.json({ error: "UNKNOWN" }, { status: 400 });
}
