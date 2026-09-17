import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { studioConfig } from "@/lib/studio-config";

type BookingLike = {
  id: string;
  clientName: string;
  clientPhone: string;
  source: string;
  startsAt: Date;
  service: { nameRu: string };
  master: { name: string };
};

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  replyMarkup?: object,
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("TELEGRAM_BOT_TOKEN missing — skip notify");
    return;
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
  }
}

export async function notifyAdmin(text: string, replyMarkup?: object) {
  const adminId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!adminId) return;
  await sendTelegramMessage(adminId, text, replyMarkup);
}

export async function notifyAdminNewBooking(booking: BookingLike) {
  const local = toZonedTime(booking.startsAt, studioConfig.timezone);
  const when = format(local, "dd.MM.yyyy HH:mm");
  const text =
    `✨ <b>Новая запись</b>\n` +
    `━━━━━━━━━━━━\n` +
    `👤 <b>${escapeHtml(booking.clientName)}</b>\n` +
    `📞 ${escapeHtml(booking.clientPhone)}\n` +
    `💅 ${escapeHtml(booking.service.nameRu)}\n` +
    `👩‍⚕️ ${escapeHtml(booking.master.name)}\n` +
    `🗓 ${when}\n` +
    `📎 ${booking.source === "BOT" ? "Telegram-бот" : "Сайт"}`;

  await notifyAdmin(text, {
    inline_keyboard: [
      [
        { text: "✅ Принят", callback_data: `bstatus:${booking.id}:CONFIRMED` },
        { text: "❌ Отклонён", callback_data: `bstatus:${booking.id}:CANCELLED` },
      ],
      [{ text: "✔ Check-in", callback_data: `bcheckin:${booking.id}` }],
    ],
  });
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
