import { setRequestLocale, getTranslations } from "next-intl/server";
import { studioConfig } from "@/lib/studio-config";
import type { AppLocale } from "@/lib/studio-config";
import { Reveal } from "@/components/Reveal";
import { Link } from "@/i18n/navigation";

export default async function ContactsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as AppLocale;
  const t = await getTranslations({ locale, namespace: "contacts" });
  const th = await getTranslations({ locale, namespace: "hero" });

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-6">
      <Reveal>
        <h1 className="font-display text-5xl text-charcoal">{t("title")}</h1>
        <p className="mt-3 text-muted">{t("subtitle")}</p>
      </Reveal>

      <div className="mt-14 grid gap-12 md:grid-cols-2">
        <Reveal>
          <div className="space-y-8">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-gold-dim">
                {t("address")}
              </p>
              <p className="mt-2 text-lg text-charcoal">{studioConfig.address[loc]}</p>
            </div>
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-gold-dim">
                {t("phone")}
              </p>
              <p className="mt-2 text-muted">{studioConfig.phoneNote[loc]}</p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={studioConfig.socials.instagram}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost"
              >
                {t("instagram")}
              </a>
              <a
                href={studioConfig.socials.telegram}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
              >
                {t("bot")}
              </a>
            </div>
            <Link href="/booking" className="inline-block text-sm text-gold-dim hover:text-charcoal">
              {th("cta")} →
            </Link>
          </div>
        </Reveal>
        <Reveal>
          <div className="aspect-[4/3] w-full overflow-hidden bg-mist">
            <iframe
              title={t("map")}
              className="h-full w-full border-0 opacity-90"
              src="https://www.openstreetmap.org/export/embed.html?bbox=69.20%2C41.28%2C69.35%2C41.36&layer=mapnik&marker=41.33%2C69.28"
              loading="lazy"
            />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
