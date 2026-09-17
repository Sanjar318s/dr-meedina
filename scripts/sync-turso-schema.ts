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
    `ALTER TABLE "BotUser" ADD COLUMN "tgUiMsgId" INTEGER`,
    `ALTER TABLE "Booking" ADD COLUMN "tgNotifyChatId" TEXT`,
    `ALTER TABLE "Booking" ADD COLUMN "tgNotifyMsgId" INTEGER`,
    `ALTER TABLE "Booking" ADD COLUMN "checkToken" TEXT`,
    `ALTER TABLE "Booking" ADD COLUMN "servedAt" DATETIME`,
    `ALTER TABLE "Booking" ADD COLUMN "tgHidden" BOOLEAN NOT NULL DEFAULT false`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Booking_checkToken_key" ON "Booking"("checkToken")`,
    `CREATE INDEX IF NOT EXISTS "Booking_checkToken_idx" ON "Booking"("checkToken")`,
    `ALTER TABLE "SiteSettings" ADD COLUMN "heroVideoUrl" TEXT`,
    `ALTER TABLE "SiteSettings" ADD COLUMN "heroHeadlineUz" TEXT NOT NULL DEFAULT 'Toza teri — sizning ishonchingiz'`,
    `ALTER TABLE "SiteSettings" ADD COLUMN "heroHeadlineRu" TEXT NOT NULL DEFAULT 'Чистая кожа — твоя уверенность'`,
    `ALTER TABLE "SiteSettings" ADD COLUMN "heroHeadlineEn" TEXT NOT NULL DEFAULT 'Clear skin is your confidence'`,
    `ALTER TABLE "SiteSettings" ADD COLUMN "heroSubUz" TEXT NOT NULL DEFAULT 'Tibbiy ma''lumotli kosmetolog.'`,
    `ALTER TABLE "SiteSettings" ADD COLUMN "heroSubRu" TEXT NOT NULL DEFAULT 'Косметолог с медицинским образованием.'`,
    `ALTER TABLE "SiteSettings" ADD COLUMN "heroSubEn" TEXT NOT NULL DEFAULT 'A cosmetologist with medical education.'`,
    `ALTER TABLE "SiteSettings" ADD COLUMN "aboutTitleUz" TEXT NOT NULL DEFAULT 'Dr.Meedina haqida'`,
    `ALTER TABLE "SiteSettings" ADD COLUMN "aboutTitleRu" TEXT NOT NULL DEFAULT 'О Dr.Meedina'`,
    `ALTER TABLE "SiteSettings" ADD COLUMN "aboutTitleEn" TEXT NOT NULL DEFAULT 'About Dr.Meedina'`,
    `ALTER TABLE "SiteSettings" ADD COLUMN "aboutTextUz" TEXT NOT NULL DEFAULT 'Men Madina — tibbiy ma''lumotli shifokor-kosmetologman.'`,
    `ALTER TABLE "SiteSettings" ADD COLUMN "aboutTextRu" TEXT NOT NULL DEFAULT 'Меня зовут Мадина — я врач-косметолог с медицинским образованием.'`,
    `ALTER TABLE "SiteSettings" ADD COLUMN "aboutTextEn" TEXT NOT NULL DEFAULT 'I''m Madina — a cosmetologist with medical education.'`,
    `ALTER TABLE "NewsPost" ADD COLUMN "imageUrls" TEXT`,
    `CREATE TABLE IF NOT EXISTS "ScheduleSettings" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "workDays" TEXT NOT NULL DEFAULT '[1,2,3,4,5,6]',
      "openHour" INTEGER NOT NULL DEFAULT 10,
      "closeHour" INTEGER NOT NULL DEFAULT 20,
      "slotStepMinutes" INTEGER NOT NULL DEFAULT 30,
      "closedDates" TEXT NOT NULL DEFAULT '[]'
    )`,
    `INSERT OR IGNORE INTO "ScheduleSettings" ("id") VALUES ('default')`,
    `CREATE TABLE IF NOT EXISTS "TickerItem" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "textUz" TEXT NOT NULL,
      "textRu" TEXT NOT NULL,
      "textEn" TEXT NOT NULL,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
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
      "telegramBot" TEXT NOT NULL DEFAULT 'https://t.me/Dr_Meedinabot?start=book',
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
      "imageUrls" TEXT,
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
      console.log("OK:", sql.slice(0, 70).replace(/\s+/g, " "));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/duplicate column|already exists|UNIQUE constraint/i.test(msg)) {
        console.log("SKIP:", msg.slice(0, 100));
      } else {
        console.warn("WARN:", msg);
      }
    }
  }

  // Backfill checkToken for existing bookings without one
  try {
    const rows = await client.execute(`SELECT id FROM "Booking" WHERE "checkToken" IS NULL OR "checkToken" = ''`);
    for (const row of rows.rows) {
      const id = String(row.id);
      const token = `ct_${id.slice(0, 8)}_${Math.random().toString(36).slice(2, 10)}`;
      await client.execute({
        sql: `UPDATE "Booking" SET "checkToken" = ? WHERE id = ?`,
        args: [token, id],
      });
    }
    console.log("Backfilled checkTokens:", rows.rows.length);
  } catch (e: unknown) {
    console.warn("checkToken backfill:", e instanceof Error ? e.message : e);
  }

  console.log("Turso schema sync done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
