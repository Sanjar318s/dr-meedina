export async function sendTelegramMessage(chatId: string | number, text: string) {
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
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error("Telegram notify failed", body);
  }
}

export async function notifyAdmin(text: string) {
  const adminId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!adminId) return;
  await sendTelegramMessage(adminId, text);
}
