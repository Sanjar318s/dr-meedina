import type { Context, SessionFlavor } from "grammy";
import { InlineKeyboard, Keyboard } from "grammy";
import { prisma } from "@/lib/prisma";

type AnyCtx = Context & SessionFlavor<{ lang?: string }>;

/**
 * Single-screen UX: replace previous bot UI message (edit or delete+send)
 * so the chat does not stack menus.
 */
export async function sendScreen(
  ctx: AnyCtx,
  text: string,
  options?: {
    parse_mode?: "HTML" | "Markdown";
    reply_markup?: InlineKeyboard | Keyboard | object;
  },
) {
  if (!ctx.from || !ctx.chat) return;

  const telegramId = String(ctx.from.id);
  const chatId = ctx.chat.id;
  const user = await prisma.botUser.findUnique({ where: { telegramId } });
  const prevId = user?.tgUiMsgId ?? undefined;

  const payload = {
    parse_mode: options?.parse_mode,
    reply_markup: options?.reply_markup,
  };

  if (prevId) {
    try {
      await ctx.api.editMessageText(chatId, prevId, text, payload as never);
      return;
    } catch {
      try {
        await ctx.api.deleteMessage(chatId, prevId);
      } catch {
        /* ignore */
      }
    }
  }

  const msg = await ctx.reply(text, payload as never);
  try {
    await prisma.botUser.updateMany({
      where: { telegramId },
      data: { tgUiMsgId: msg.message_id },
    });
  } catch (e) {
    console.warn("tgUiMsgId update failed", e);
  }
}

/** Force a fresh message (e.g. after photo greeting) and remember its id */
export async function sendFreshScreen(
  ctx: AnyCtx,
  text: string,
  options?: {
    parse_mode?: "HTML" | "Markdown";
    reply_markup?: InlineKeyboard | Keyboard | object;
  },
) {
  if (!ctx.from || !ctx.chat) return;
  const telegramId = String(ctx.from.id);
  const user = await prisma.botUser.findUnique({ where: { telegramId } });
  if (user?.tgUiMsgId) {
    try {
      await ctx.api.deleteMessage(ctx.chat.id, user.tgUiMsgId);
    } catch {
      /* ignore */
    }
  }
  const msg = await ctx.reply(text, {
    parse_mode: options?.parse_mode,
    reply_markup: options?.reply_markup as never,
  });
  await prisma.botUser.updateMany({
    where: { telegramId },
    data: { tgUiMsgId: msg.message_id },
  });
}

export async function clearScreen(ctx: AnyCtx) {
  if (!ctx.from || !ctx.chat) return;
  const telegramId = String(ctx.from.id);
  const user = await prisma.botUser.findUnique({ where: { telegramId } });
  if (user?.tgUiMsgId) {
    try {
      await ctx.api.deleteMessage(ctx.chat.id, user.tgUiMsgId);
    } catch {
      /* ignore */
    }
    await prisma.botUser.updateMany({
      where: { telegramId },
      data: { tgUiMsgId: null },
    });
  }
}
