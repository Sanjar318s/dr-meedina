export const studioConfig = {
  brand: "dr.meedina",
  doctorName: "Мадина",
  timezone: "Asia/Tashkent",
  openHour: 10,
  closeHour: 20,
  slotStepMinutes: 30,
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
  },
  tagline: {
    uz: "Toza teri — sizning ishonchingiz",
    ru: "Чистая кожа — твоя уверенность",
    en: "Clear skin is your confidence",
  },
} as const;

export type AppLocale = "uz" | "ru" | "en";
