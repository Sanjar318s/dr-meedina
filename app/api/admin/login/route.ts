import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createAdminToken,
  setAdminSession,
  verifyPassword,
} from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const { login, password } = schema.parse(await req.json());
    const user = await prisma.adminUser.findUnique({ where: { login } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }
    const token = await createAdminToken(login);
    await setAdminSession(token);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
}
