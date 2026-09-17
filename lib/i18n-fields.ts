import type { AppLocale } from "./studio-config";

type LocalizedFields = {
  nameUz?: string;
  nameRu?: string;
  nameEn?: string;
  descriptionUz?: string;
  descriptionRu?: string;
  descriptionEn?: string;
  specializationUz?: string;
  specializationRu?: string;
  specializationEn?: string;
  bioUz?: string;
  bioRu?: string;
  bioEn?: string;
};

export function pickName(item: LocalizedFields, locale: AppLocale) {
  if (locale === "uz") return item.nameUz || "";
  if (locale === "en") return item.nameEn || "";
  return item.nameRu || "";
}

export function pickDescription(item: LocalizedFields, locale: AppLocale) {
  if (locale === "uz") return item.descriptionUz || "";
  if (locale === "en") return item.descriptionEn || "";
  return item.descriptionRu || "";
}

export function pickSpecialization(item: LocalizedFields, locale: AppLocale) {
  if (locale === "uz") return item.specializationUz || "";
  if (locale === "en") return item.specializationEn || "";
  return item.specializationRu || "";
}

export function pickBio(item: LocalizedFields, locale: AppLocale) {
  if (locale === "uz") return item.bioUz || "";
  if (locale === "en") return item.bioEn || "";
  return item.bioRu || "";
}

export function formatPrice(price: number, locale: AppLocale) {
  const loc = locale === "uz" ? "uz-UZ" : locale === "en" ? "en-US" : "ru-RU";
  return new Intl.NumberFormat(loc).format(price) + " so'm";
}
