import { setRequestLocale, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/lib/studio-config";
import { Reveal } from "@/components/Reveal";
import { Link } from "@/i18n/navigation";
import { getSiteSettings } from "@/lib/site-settings";
import { AddressActions } from "@/components/AddressActions";

export const dynamic = "force-dynamic";

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
  const settings = await getSiteSettings();
  const address = settings.address[loc];
  const mapSrc = `https://yandex.ru/map-widget/v1/?ll=${settings.lng}%2C${settings.lat}&z=14&pt=${settings.lng}%2C${settings.lat},pm2rdm`;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-6">
      <Reveal>
        <h1 className="font-display text-5xl text-cream">{t("title")}</h1>
        <p className="mt-3 text-muted">{t("subtitle")}</p>
      </Reveal>

      <div className="mt-12 grid gap-12 md:grid-cols-2">
        <Reveal>
          <div className="space-y-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gold">{t("address")}</p>
              <p className="mt-2 text-lg text-cream">{address}</p>
              <AddressActions
                address={address}
                lat={settings.lat}
                lng={settings.lng}
                copyLabel={t("copyAddress")}
                copiedLabel={t("copied")}
                mapsLabel={t("openMaps")}
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gold">{t("phone")}</p>
              <p className="mt-2 text-muted">{settings.phoneNote[loc]}</p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={settings.socials.instagram}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost"
              >
                {t("instagram")}
              </a>
              <a
                href={settings.socials.telegramBot}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
              >
                {t("bookBot")}
              </a>
              <a
                href={settings.socials.telegram}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost"
              >
                {t("bot")}
              </a>
            </div>
            <Link href="/booking" className="inline-block text-sm text-gold hover:text-cream">
              {th("cta")} →
            </Link>
          </div>
        </Reveal>
        <Reveal>
          <div className="aspect-[4/3] w-full overflow-hidden ring-1 ring-white/10">
            <iframe
              title={t("map")}
              className="h-full w-full border-0"
              src={mapSrc}
              loading="lazy"
            />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
