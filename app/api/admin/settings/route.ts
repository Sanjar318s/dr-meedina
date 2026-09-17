import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { z } from "zod";

async function guard() {
  return getAdminSession();
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const row = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  if (!row) {
    const created = await prisma.siteSettings.create({ data: { id: "default" } });
    return NextResponse.json(created);
  }
  return NextResponse.json(row);
}

const schema = z.object({
  brand: z.string().min(1),
  doctorName: z.string().min(1),
  addressUz: z.string().min(1),
  addressRu: z.string().min(1),
  addressEn: z.string().min(1),
  phone: z.string().min(1),
  phoneNoteUz: z.string().min(1),
  phoneNoteRu: z.string().min(1),
  phoneNoteEn: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  instagram: z.string().url(),
  telegram: z.string().url(),
  telegramBot: z.string().url(),
  taglineUz: z.string().min(1),
  taglineRu: z.string().min(1),
  taglineEn: z.string().min(1),
  welcomeImageUrl: z.string().optional().nullable(),
  heroVideoUrl: z.string().optional().nullable(),
  heroHeadlineUz: z.string().min(1),
  heroHeadlineRu: z.string().min(1),
  heroHeadlineEn: z.string().min(1),
  heroSubUz: z.string().min(1),
  heroSubRu: z.string().min(1),
  heroSubEn: z.string().min(1),
  aboutTitleUz: z.string().min(1),
  aboutTitleRu: z.string().min(1),
  aboutTitleEn: z.string().min(1),
  aboutTextUz: z.string().min(1),
  aboutTextRu: z.string().min(1),
  aboutTextEn: z.string().min(1),
});

export async function PUT(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const data = schema.parse(await req.json());
  const row = await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });
  return NextResponse.json(row);
}
