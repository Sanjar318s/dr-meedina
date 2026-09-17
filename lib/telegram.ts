import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { studioConfig } from "@/lib/studio-config";
import { prisma } from "@/lib/prisma";

type BookingLike = {
  id: string;
  clientName: string;
  clientPhone: string;
  source: string;
  status?: string;
  servedAt?: Date | null;
  startsAt: Date;
  service: { nameRu: string };
  master: { name: string };
};

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function bookingNotifyText(booking: BookingLike) {
  const local = toZonedTime(booking.startsAt, studioConfig.timezone);
  const when = format(local, "dd.MM.yyyy HH:mm");
  const statusLine = formatStatusLine(booking);
  return (
    `✨ <b>Новая запись</b>\n` +
    `━━━━━━━━━━━━\n` +
    `👤 <b>${escapeHtml(booking.clientName)}</b>\n` +
    `📞 ${escapeHtml(booking.clientPhone)}\n` +
    `💅 ${escapeHtml(booking.service.nameRu)}\n` +
    `👩‍⚕️ ${escapeHtml(booking.master.name)}\n` +
    `🗓 ${when}\n` +
    `📎 ${booking.source === "BOT" ? "Telegram-бот" : "Сайт"}\n` +
    `📌 ${statusLine}`
  );
}

export function formatStatusLine(booking: Pick<BookingLike, "status" | "servedAt">) {
  const status = booking.status || "PENDING";
  if (status === "SERVED") {
    const at = booking.servedAt
      ? format(toZonedTime(booking.servedAt, studioConfig.timezone), "dd.MM HH:mm")
      : "";
    return `QR принят · визит отмечен${at ? ` (${at})` : ""}`;
  }
  if (status === "CONFIRMED") return "Принята · QR ещё не отсканирован";
  if (status === "CANCELLED") return "Отклонена";
  return "Ожидает · QR ещё не отсканирован";
}

export function formatQrStatusAlert(booking: Pick<BookingLike, "status" | "servedAt">) {
  const status = booking.status || "PENDING";
  if (status === "SERVED") {
    const at = booking.servedAt
      ? format(toZonedTime(booking.servedAt, studioConfig.timezone), "HH:mm")
      : "";
    return at ? `QR принят ✓ · ${at}` : "QR принят ✓";
  }
  if (status === "CANCELLED") return "Запись отклонена";
  return "QR ещё не отсканирован";
}

/** Keyboard for admin notify message — empty when SERVED/CANCELLED */
export function bookingNotifyKeyboard(booking: { id: string; status?: string }) {
  const status = booking.status || "PENDING";
  if (status === "SERVED" || status === "CANCELLED") {
    return { inline_keyboard: [] as { text: string; callback_data: string }[][] };
  }
  const rows: { text: string; callback_data: string }[][] = [];
  if (status === "PENDING") {
    rows.push([
      { text: "✅ Принят", callback_data: `bstatus:${booking.id}:CONFIRMED` },
      { text: "❌ Отклонён", callback_data: `bstatus:${booking.id}:CANCELLED` },
    ]);
  } else if (status === "CONFIRMED") {
    rows.push([{ text: "Уже принята", callback_data: "noop" }]);
  }
  rows.push([{ text: "✔ Check-in", callback_data: `bcheckin:${booking.id}` }]);
  return { inline_keyboard: rows };
}

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  replyMarkup?: object,
): Promise<{ messageId?: number } | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("TELEGRAM_BOT_TOKEN missing — skip notify");
    return null;
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error("Telegram notify failed", body);
    return null;
  }
  const data = (await res.json()) as { result?: { message_id?: number } };
  return { messageId: data.result?.message_id };
}

export async function editTelegramMessage(
  chatId: string | number,
  messageId: number,
  text: string,
  replyMarkup?: object,
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  const res = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
    }),
  });
  if (!res.ok) {
    await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        reply_markup: replyMarkup || { inline_keyboard: [] },
      }),
    }).catch(() => undefined);
  }
}

export async function deleteTelegramMessage(chatId: string | number, messageId: number) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  const res = await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
  });
  return res.ok;
}

/** Delete stored admin notify message after actions are done */
export async function clearBookingTelegramCard(bookingId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking?.tgNotifyChatId || !booking.tgNotifyMsgId) return;

  await deleteTelegramMessage(booking.tgNotifyChatId, booking.tgNotifyMsgId);
  try {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { tgNotifyChatId: null, tgNotifyMsgId: null },
    });
  } catch {
    /* booking may already be deleted */
  }
}

export async function notifyAdmin(text: string, replyMarkup?: object) {
  const adminId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!adminId) return;
  await sendTelegramMessage(adminId, text, replyMarkup);
}

export async function notifyAdminNewBooking(booking: BookingLike) {
  const adminId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!adminId) return;

  const text = bookingNotifyText({ ...booking, status: booking.status || "PENDING" });
  const result = await sendTelegramMessage(
    adminId,
    text,
    bookingNotifyKeyboard({ id: booking.id, status: booking.status || "PENDING" }),
  );

  if (result?.messageId) {
    try {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          tgNotifyChatId: String(adminId),
          tgNotifyMsgId: result.messageId,
        },
      });
    } catch (e) {
      console.error("Failed to store tg notify message id", e);
    }
  }
}

/**
 * After status change: delete card when action is finished
 * (accepted / declined / served / forgotten), otherwise refresh text+buttons.
 */
export async function refreshBookingTelegramCard(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { service: true, master: true },
  });
  if (!booking?.tgNotifyChatId || !booking.tgNotifyMsgId) return;

  const done =
    booking.status === "CONFIRMED" ||
    booking.status === "CANCELLED" ||
    booking.status === "SERVED" ||
    booking.tgHidden;

  if (done) {
    await clearBookingTelegramCard(bookingId);
    return;
  }

  await editTelegramMessage(
    booking.tgNotifyChatId,
    booking.tgNotifyMsgId,
    bookingNotifyText(booking),
    bookingNotifyKeyboard(booking),
  );
}
