import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getAdminSession } from "@/lib/auth";
import { nanoid } from "nanoid";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "NO_FILE" }, { status: 400 });
  }

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "INVALID_TYPE" }, { status: 400 });
  }
  if (isImage && file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "IMAGE_TOO_LARGE" }, { status: 400 });
  }
  if (isVideo && file.size > 40 * 1024 * 1024) {
    return NextResponse.json({ error: "VIDEO_TOO_LARGE" }, { status: 400 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    // Dev fallback: data URL not ideal for large files — return error with clear message
    return NextResponse.json(
      { error: "BLOB_TOKEN_MISSING", message: "Set BLOB_READ_WRITE_TOKEN in env" },
      { status: 503 },
    );
  }

  const ext = file.name.split(".").pop() || (isImage ? "jpg" : "mp4");
  const pathname = `media/${nanoid()}.${ext}`;
  const blob = await put(pathname, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return NextResponse.json({ url: blob.url });
}
