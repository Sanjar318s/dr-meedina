import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });
  return NextResponse.json(services);
}
