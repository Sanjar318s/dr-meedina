export const studioConfig = {
  brand: "Dr.Meedina",
  doctorName: "Мадина",
  timezone: "Asia/Tashkent",
  openHour: 10,
  closeHour: 20,
  slotStepMinutes: 30,
  map: {
    lat: 41.33,
    lng: 69.28,
  },
  address: {
    uz: "Toshkent",
    ru: "Ташкент",
    en: "Tashkent",
  },
  phone: "+998 90",
  phoneNote: {
    uz: "To‘liq raqam — Telegram yoki Instagram orqali",
    ru: "Полный номер — в Telegram или Instagram",
    en: "Full number via Telegram or Instagram",
  },
  socials: {
    instagram: "https://www.instagram.com/dr.meedina/",
    telegram: "https://t.me/drmeedina",
    telegramBot: `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME || "drmeedina"}?start=book`,
  },
  tagline: {
    uz: "Toza teri — sizning ishonchingiz",
    ru: "Чистая кожа — твоя уверенность",
    en: "Clear skin is your confidence",
  },
  welcomeImageUrl:
    "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=1200&q=80",
} as const;

export type AppLocale = "uz" | "ru" | "en";
