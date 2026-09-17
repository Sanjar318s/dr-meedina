-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameUz" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionUz" TEXT NOT NULL,
    "descriptionRu" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "gallery" TEXT,
    "videoUrl" TEXT,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Master" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "photoUrl" TEXT,
    "specializationUz" TEXT NOT NULL,
    "specializationRu" TEXT NOT NULL,
    "specializationEn" TEXT NOT NULL,
    "bioUz" TEXT NOT NULL,
    "bioRu" TEXT NOT NULL,
    "bioEn" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "clientTelegramId" TEXT,
    "serviceId" TEXT NOT NULL,
    "masterId" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "source" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "Master" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "login" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
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
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BotUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "lang" TEXT NOT NULL DEFAULT 'ru',
    "subscribedNews" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "NewsPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdBy" TEXT,
    "broadcast" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BotActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "meta" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BotActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "BotUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Booking_masterId_startsAt_endsAt_idx" ON "Booking"("masterId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_startsAt_idx" ON "Booking"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_login_key" ON "AdminUser"("login");

-- CreateIndex
CREATE UNIQUE INDEX "BotUser_telegramId_key" ON "BotUser"("telegramId");

-- CreateIndex
CREATE INDEX "BotActivity_userId_createdAt_idx" ON "BotActivity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "BotActivity_createdAt_idx" ON "BotActivity"("createdAt");
