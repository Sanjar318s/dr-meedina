import type { Context, SessionFlavor } from "grammy";
import { InlineKeyboard, Keyboard } from "grammy";
import { prisma } from "@/lib/prisma";

type AnyCtx = Context & SessionFlavor<{ lang?: string }>;

type ScreenOptions = {
  parse_mode?: "HTML" | "Markdown";
  reply_markup?: InlineKeyboard | Keyboard | object;
  /** Reply keyboard to keep visible (Telegram can't attach both markups to one message). */
  menu?: Keyboard;
};

/**
 * Re-apply reply keyboard without leaving a visible bubble.
 * Needed after messages that only carry an InlineKeyboard.
 */
export async function reapplyReplyKeyboard(ctx: AnyCtx, keyboard: Keyboard) {
  if (!ctx.chat) return;
  try {
    const msg = await ctx.reply("\u2060", { reply_markup: keyboard });
    try {
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
    } catch {
      /* keyboard still applied even if delete fails */
    }
  } catch (e) {
    console.warn("reapplyReplyKeyboard failed", e);
  }
}

/**
 * Single-screen UX: replace previous bot UI message (edit or delete+send)
 * so the chat does not stack menus.
 */
export async function sendScreen(ctx: AnyCtx, text: string, options?: ScreenOptions) {
  if (!ctx.from || !ctx.chat) return;

  const telegramId = String(ctx.from.id);
  const chatId = ctx.chat.id;
  const user = await prisma.botUser.findUnique({ where: { telegramId } });
  const prevId = user?.tgUiMsgId ?? undefined;

  const payload = {
    parse_mode: options?.parse_mode,
    reply_markup: options?.reply_markup,
  };

  let sent = false;
  if (prevId) {
    try {
      await ctx.api.editMessageText(chatId, prevId, text, payload as never);
      sent = true;
    } catch {
      try {
        await ctx.api.deleteMessage(chatId, prevId);
      } catch {
        /* ignore */
      }
    }
  }

  if (!sent) {
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

  if (options?.menu) {
    await reapplyReplyKeyboard(ctx, options.menu);
  }
}

/** Force a fresh message (e.g. after photo greeting) and remember its id */
export async function sendFreshScreen(ctx: AnyCtx, text: string, options?: ScreenOptions) {
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

  if (options?.menu) {
    await reapplyReplyKeyboard(ctx, options.menu);
  }
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
