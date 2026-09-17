import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { z } from "zod";

async function guard() {
  return getAdminSession();
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const services = await prisma.service.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(services);
}

const serviceSchema = z.object({
  id: z.string().optional(),
  nameUz: z.string().min(1),
  nameRu: z.string().min(1),
  nameEn: z.string().min(1),
  descriptionUz: z.string().min(1),
  descriptionRu: z.string().min(1),
  descriptionEn: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  price: z.number().int().nonnegative(),
  imageUrl: z.string().optional().nullable(),
  gallery: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  category: z.string().min(1),
  isActive: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const data = serviceSchema.parse(await req.json());
  const service = await prisma.service.create({
    data: {
      ...data,
      imageUrl: data.imageUrl || null,
      gallery: data.gallery || null,
      videoUrl: data.videoUrl || null,
      isActive: data.isActive ?? true,
    },
  });
  return NextResponse.json(service);
}

export async function PUT(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const data = serviceSchema.parse(await req.json());
  if (!data.id) return NextResponse.json({ error: "ID_REQUIRED" }, { status: 400 });
  const { id, ...rest } = data;
  const service = await prisma.service.update({
    where: { id },
    data: {
      ...rest,
      imageUrl: rest.imageUrl || null,
      gallery: rest.gallery || null,
      videoUrl: rest.videoUrl || null,
    },
  });
  return NextResponse.json(service);
}

export async function DELETE(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID_REQUIRED" }, { status: 400 });
  const activate = req.nextUrl.searchParams.get("activate") === "1";
  await prisma.service.update({ where: { id }, data: { isActive: activate } });
  return NextResponse.json({ ok: true });
}
