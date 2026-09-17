import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const masters = await prisma.master.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(masters);
}
