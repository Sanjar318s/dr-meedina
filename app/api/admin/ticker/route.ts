import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const items = await prisma.tickerItem.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json(items);
}

const schema = z.object({
  id: z.string().optional(),
  textUz: z.string().min(1).max(120),
  textRu: z.string().min(1).max(120),
  textEn: z.string().min(1).max(120),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const data = schema.parse(await req.json());
  const item = await prisma.tickerItem.create({
    data: {
      textUz: data.textUz,
      textRu: data.textRu,
      textEn: data.textEn,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
  });
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const data = schema.parse(await req.json());
  if (!data.id) return NextResponse.json({ error: "ID" }, { status: 400 });
  const { id, ...rest } = data;
  const item = await prisma.tickerItem.update({ where: { id }, data: rest });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID" }, { status: 400 });
  await prisma.tickerItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
