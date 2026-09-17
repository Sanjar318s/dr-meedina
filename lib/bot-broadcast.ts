import { prisma } from "@/lib/prisma";

export async function broadcastNews(newsId: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, sent: 0, error: "NO_TOKEN" };

  const post = await prisma.newsPost.findUnique({ where: { id: newsId } });
  if (!post) return { ok: false, sent: 0, error: "NOT_FOUND" };

  const users = await prisma.botUser.findMany({
    where: { subscribedNews: true },
  });

  let sent = 0;
  for (const user of users) {
    try {
      if (post.imageUrl) {
        await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: user.telegramId,
            photo: post.imageUrl,
            caption: post.text.slice(0, 1000),
            parse_mode: "HTML",
          }),
        });
      } else {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: user.telegramId,
            text: post.text,
            parse_mode: "HTML",
          }),
        });
      }
      sent += 1;
    } catch {
      /* skip failed */
    }
  }

  await prisma.newsPost.update({
    where: { id: newsId },
    data: { broadcast: true },
  });

  return { ok: true, sent };
}
