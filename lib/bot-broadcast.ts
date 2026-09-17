import { prisma } from "@/lib/prisma";

function parseImageUrls(post: { imageUrl: string | null; imageUrls: string | null }): string[] {
  if (post.imageUrls) {
    try {
      const arr = JSON.parse(post.imageUrls);
      if (Array.isArray(arr)) return arr.filter((x) => typeof x === "string");
    } catch {
      /* ignore */
    }
  }
  if (post.imageUrl) return [post.imageUrl];
  return [];
}

export async function broadcastNews(newsId: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, sent: 0, error: "NO_TOKEN" };

  const post = await prisma.newsPost.findUnique({ where: { id: newsId } });
  if (!post) return { ok: false, sent: 0, error: "NOT_FOUND" };

  const images = parseImageUrls(post);
  const users = await prisma.botUser.findMany({
    where: { subscribedNews: true },
  });

  let sent = 0;
  for (const user of users) {
    try {
      if (images.length > 1) {
        const media = images.slice(0, 10).map((url, i) => ({
          type: "photo",
          media: url,
          ...(i === 0 ? { caption: post.text.slice(0, 1000), parse_mode: "HTML" } : {}),
        }));
        await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: user.telegramId, media }),
        });
      } else if (images.length === 1) {
        await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: user.telegramId,
            photo: images[0],
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
