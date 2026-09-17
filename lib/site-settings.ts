import { prisma } from "@/lib/prisma";
import { studioConfig, type AppLocale } from "@/lib/studio-config";

export type SiteSettingsView = {
  brand: string;
  doctorName: string;
  address: Record<AppLocale, string>;
  phone: string;
  phoneNote: Record<AppLocale, string>;
  lat: number;
  lng: number;
  socials: {
    instagram: string;
    telegram: string;
    telegramBot: string;
  };
  tagline: Record<AppLocale, string>;
  welcomeImageUrl: string;
  heroVideoUrl: string | null;
  heroHeadline: Record<AppLocale, string>;
  heroSub: Record<AppLocale, string>;
  aboutTitle: Record<AppLocale, string>;
  aboutText: Record<AppLocale, string>;
};

function fromDefaults(): SiteSettingsView {
  return {
    brand: studioConfig.brand,
    doctorName: studioConfig.doctorName,
    address: { ...studioConfig.address },
    phone: studioConfig.phone,
    phoneNote: { ...studioConfig.phoneNote },
    lat: studioConfig.map.lat,
    lng: studioConfig.map.lng,
    socials: {
      instagram: studioConfig.socials.instagram,
      telegram: studioConfig.socials.telegram,
      telegramBot: studioConfig.socials.telegramBot,
    },
    tagline: { ...studioConfig.tagline },
    welcomeImageUrl: studioConfig.welcomeImageUrl,
    heroVideoUrl: process.env.NEXT_PUBLIC_HERO_VIDEO_URL || null,
    heroHeadline: { ...studioConfig.tagline },
    heroSub: {
      uz: "Tibbiy ma'lumotli kosmetolog. Har bir mijozga individual yondashuv.",
      ru: "Косметолог с медицинским образованием. Индивидуальный подход каждому.",
      en: "A cosmetologist with medical education. Personalized care for every patient.",
    },
    aboutTitle: {
      uz: "Dr.Meedina haqida",
      ru: "О Dr.Meedina",
      en: "About Dr.Meedina",
    },
    aboutText: {
      uz: "Men Madina — tibbiy ma'lumotli shifokor-kosmetologman.",
      ru: "Меня зовут Мадина — я врач-косметолог с медицинским образованием.",
      en: "I'm Madina — a cosmetologist with medical education.",
    },
  };
}

export async function getSiteSettings(): Promise<SiteSettingsView> {
  try {
    const row = await prisma.siteSettings.findUnique({ where: { id: "default" } });
    if (!row) return fromDefaults();
    return {
      brand: row.brand,
      doctorName: row.doctorName,
      address: { uz: row.addressUz, ru: row.addressRu, en: row.addressEn },
      phone: row.phone,
      phoneNote: {
        uz: row.phoneNoteUz,
        ru: row.phoneNoteRu,
        en: row.phoneNoteEn,
      },
      lat: row.lat,
      lng: row.lng,
      socials: {
        instagram: row.instagram,
        telegram: row.telegram,
        telegramBot: row.telegramBot,
      },
      tagline: {
        uz: row.taglineUz,
        ru: row.taglineRu,
        en: row.taglineEn,
      },
      welcomeImageUrl: row.welcomeImageUrl || studioConfig.welcomeImageUrl,
      heroVideoUrl: row.heroVideoUrl || process.env.NEXT_PUBLIC_HERO_VIDEO_URL || null,
      heroHeadline: {
        uz: row.heroHeadlineUz,
        ru: row.heroHeadlineRu,
        en: row.heroHeadlineEn,
      },
      heroSub: {
        uz: row.heroSubUz,
        ru: row.heroSubRu,
        en: row.heroSubEn,
      },
      aboutTitle: {
        uz: row.aboutTitleUz,
        ru: row.aboutTitleRu,
        en: row.aboutTitleEn,
      },
      aboutText: {
        uz: row.aboutTextUz,
        ru: row.aboutTextRu,
        en: row.aboutTextEn,
      },
    };
  } catch {
    return fromDefaults();
  }
}

export function parseGallery(gallery: string | null | undefined): string[] {
  if (!gallery) return [];
  try {
    const parsed = JSON.parse(gallery);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function getActiveTicker() {
  try {
    return await prisma.tickerItem.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  } catch {
    return [];
  }
}
