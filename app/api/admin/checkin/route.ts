import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

/** One-time QR check-in: marks booking SERVED */
export async function POST(req: NextRequest) {
  const admin = await getAdminSession();
  const body = await req.json().catch(() => ({}));
  const token = (body.token as string) || req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "TOKEN_REQUIRED" }, { status: 400 });

  // Allow admin session OR secret query for TG deep-link style
  const secret = process.env.CHECKIN_SECRET;
  const providedSecret = (body.secret as string) || req.nextUrl.searchParams.get("secret");
  if (!admin && (!secret || providedSecret !== secret)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({
    where: { checkToken: token },
    include: { service: true, master: true },
  });
  if (!booking) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (booking.status === "SERVED") {
    return NextResponse.json({ error: "ALREADY_SERVED", booking }, { status: 409 });
  }
  if (booking.status === "CANCELLED") {
    return NextResponse.json({ error: "CANCELLED" }, { status: 409 });
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "SERVED", servedAt: new Date() },
    include: { service: true, master: true },
  });
  return NextResponse.json({ ok: true, booking: updated });
}

export async function GET(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "TOKEN_REQUIRED" }, { status: 400 });
  const booking = await prisma.booking.findUnique({
    where: { checkToken: token },
    include: { service: true, master: true },
  });
  if (!booking) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json(booking);
}
