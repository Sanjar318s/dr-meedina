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
