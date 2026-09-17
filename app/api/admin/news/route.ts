import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { z } from "zod";
import { broadcastNews } from "@/lib/bot-broadcast";

async function guard() {
  return getAdminSession();
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const posts = await prisma.newsPost.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json(posts);
}

const schema = z.object({
  text: z.string().min(1),
  imageUrl: z.string().optional().nullable(),
  imageUrls: z.array(z.string()).optional(),
  broadcast: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const data = schema.parse(await req.json());
  const urls = data.imageUrls?.length
    ? data.imageUrls
    : data.imageUrl
      ? [data.imageUrl]
      : [];
  const post = await prisma.newsPost.create({
    data: {
      text: data.text,
      imageUrl: urls[0] || null,
      imageUrls: urls.length ? JSON.stringify(urls) : null,
      createdBy: "admin",
      broadcast: false,
    },
  });
  if (data.broadcast) {
    const result = await broadcastNews(post.id);
    return NextResponse.json({ ...post, broadcastResult: result });
  }
  return NextResponse.json(post);
}

export async function DELETE(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID_REQUIRED" }, { status: 400 });
  await prisma.newsPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
