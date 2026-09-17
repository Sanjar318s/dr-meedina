import "dotenv/config";
import { createClient } from "@libsql/client";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) throw new Error("TURSO env missing");

  const client = createClient({ url, authToken });

  const statements = [
    `ALTER TABLE "Service" ADD COLUMN "gallery" TEXT`,
    `ALTER TABLE "Service" ADD COLUMN "videoUrl" TEXT`,
    `CREATE TABLE IF NOT EXISTS "SiteSettings" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "brand" TEXT NOT NULL DEFAULT 'Dr.Meedina',
      "doctorName" TEXT NOT NULL DEFAULT 'Мадина',
      "addressUz" TEXT NOT NULL DEFAULT 'Toshkent',
      "addressRu" TEXT NOT NULL DEFAULT 'Ташкент',
      "addressEn" TEXT NOT NULL DEFAULT 'Tashkent',
      "phone" TEXT NOT NULL DEFAULT '+998 90',
      "phoneNoteUz" TEXT NOT NULL DEFAULT 'To‘liq raqam — Telegram yoki Instagram orqali',
      "phoneNoteRu" TEXT NOT NULL DEFAULT 'Полный номер — в Telegram или Instagram',
      "phoneNoteEn" TEXT NOT NULL DEFAULT 'Full number via Telegram or Instagram',
      "lat" REAL NOT NULL DEFAULT 41.33,
      "lng" REAL NOT NULL DEFAULT 69.28,
      "instagram" TEXT NOT NULL DEFAULT 'https://www.instagram.com/dr.meedina/',
      "telegram" TEXT NOT NULL DEFAULT 'https://t.me/drmeedina',
      "telegramBot" TEXT NOT NULL DEFAULT 'https://t.me/drmeedina?start=book',
      "taglineUz" TEXT NOT NULL DEFAULT 'Toza teri — sizning ishonchingiz',
      "taglineRu" TEXT NOT NULL DEFAULT 'Чистая кожа — твоя уверенность',
      "taglineEn" TEXT NOT NULL DEFAULT 'Clear skin is your confidence',
      "welcomeImageUrl" TEXT,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "BotUser" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "telegramId" TEXT NOT NULL,
      "username" TEXT,
      "firstName" TEXT,
      "lastName" TEXT,
      "lang" TEXT NOT NULL DEFAULT 'ru',
      "subscribedNews" BOOLEAN NOT NULL DEFAULT true,
      "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "BotUser_telegramId_key" ON "BotUser"("telegramId")`,
    `CREATE TABLE IF NOT EXISTS "NewsPost" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "text" TEXT NOT NULL,
      "imageUrl" TEXT,
      "createdBy" TEXT,
      "broadcast" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "BotActivity" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "meta" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "BotActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "BotUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS "BotActivity_userId_createdAt_idx" ON "BotActivity"("userId", "createdAt")`,
    `CREATE INDEX IF NOT EXISTS "BotActivity_createdAt_idx" ON "BotActivity"("createdAt")`,
  ];

  for (const sql of statements) {
    try {
      await client.execute(sql);
      console.log("OK:", sql.slice(0, 60).replace(/\s+/g, " "));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/duplicate column|already exists/i.test(msg)) {
        console.log("SKIP:", msg.slice(0, 80));
      } else {
        console.warn("WARN:", msg);
      }
    }
  }
  console.log("Turso schema sync done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
