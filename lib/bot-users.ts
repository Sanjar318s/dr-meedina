import { prisma } from "@/lib/prisma";

export async function touchBotUser(from: {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
}, action?: string, meta?: Record<string, unknown>) {
  const telegramId = String(from.id);
  const lang = from.language_code?.startsWith("uz")
    ? "uz"
    : from.language_code?.startsWith("en")
      ? "en"
      : "ru";

  const user = await prisma.botUser.upsert({
    where: { telegramId },
    update: {
      username: from.username,
      firstName: from.first_name,
      lastName: from.last_name,
      lastSeenAt: new Date(),
    },
    create: {
      telegramId,
      username: from.username,
      firstName: from.first_name,
      lastName: from.last_name,
      lang,
      subscribedNews: true,
    },
  });

  if (action) {
    await prisma.botActivity.create({
      data: {
        userId: user.id,
        action,
        meta: meta ? JSON.stringify(meta) : null,
      },
    });
  }

  return user;
}

export function isAdmin(telegramId?: number | string) {
  const adminId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!adminId || telegramId == null) return false;
  return String(telegramId) === String(adminId);
}
