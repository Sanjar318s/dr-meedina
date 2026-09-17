import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { z } from "zod";

async function guard() {
  return getAdminSession();
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const masters = await prisma.master.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(masters);
}

const masterSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  photoUrl: z.string().optional().nullable(),
  specializationUz: z.string().min(1),
  specializationRu: z.string().min(1),
  specializationEn: z.string().min(1),
  bioUz: z.string().min(1),
  bioRu: z.string().min(1),
  bioEn: z.string().min(1),
  isActive: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const data = masterSchema.parse(await req.json());
  const master = await prisma.master.create({
    data: {
      ...data,
      photoUrl: data.photoUrl || null,
      isActive: data.isActive ?? true,
    },
  });
  return NextResponse.json(master);
}

export async function PUT(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const data = masterSchema.parse(await req.json());
  if (!data.id) return NextResponse.json({ error: "ID_REQUIRED" }, { status: 400 });
  const { id, ...rest } = data;
  const master = await prisma.master.update({
    where: { id },
    data: { ...rest, photoUrl: rest.photoUrl || null },
  });
  return NextResponse.json(master);
}

export async function DELETE(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID_REQUIRED" }, { status: 400 });
  const activate = req.nextUrl.searchParams.get("activate") === "1";
  await prisma.master.update({ where: { id }, data: { isActive: activate } });
  return NextResponse.json({ ok: true });
}
