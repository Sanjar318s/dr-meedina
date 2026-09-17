import { setRequestLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import type { AppLocale } from "@/lib/studio-config";
import { Reveal } from "@/components/Reveal";
import { pickSpecialization, pickBio } from "@/lib/i18n-fields";
import { Link } from "@/i18n/navigation";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function MastersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as AppLocale;
  const t = await getTranslations({ locale, namespace: "masters" });
  const th = await getTranslations({ locale, namespace: "hero" });
  const settings = await getSiteSettings();

  let masters: Awaited<ReturnType<typeof prisma.master.findMany>> = [];
  try {
    masters = await prisma.master.findMany({ where: { isActive: true } });
  } catch {
    /* empty */
  }

  const master = masters[0];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-6">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.25em] text-gold">
          {master ? pickSpecialization(master, loc) : t("subtitle")}
        </p>
        <h1 className="mt-3 font-display text-5xl text-cream md:text-6xl">{t("title")}</h1>
        <p className="mt-3 max-w-xl text-muted">{t("subtitle")}</p>
      </Reveal>

      {master && (
        <div className="mt-10 grid items-center gap-12 md:mt-12 md:grid-cols-2">
          <Reveal>
            <div className="relative aspect-[3/4] overflow-hidden ring-1 ring-gold/25">
              {master.photoUrl && (
                <Image
                  src={master.photoUrl}
                  alt={master.name}
                  fill
                  className="object-cover"
                  sizes="50vw"
                  priority
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
            </div>
          </Reveal>
          <Reveal>
            <h2 className="font-display text-4xl text-cream md:text-5xl">{master.name}</h2>
            <p className="mt-2 text-gold">{pickSpecialization(master, loc)}</p>
            <p className="mt-6 max-w-md leading-relaxed text-muted">{pickBio(master, loc)}</p>
            <div className="mt-8 flex flex-wrap gap-6 border-y border-white/10 py-5 text-sm text-muted">
              <span>{t("trustEdu")}</span>
              <span className="text-white/20">|</span>
              <span>{t("trustResult")}</span>
              <span className="text-white/20">|</span>
              <span>{t("trustCity")}</span>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/booking" className="btn-primary">
                {th("cta")}
              </Link>
              <a
                href={settings.socials.instagram}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost"
              >
                {t("instagram")}
              </a>
            </div>
          </Reveal>
        </div>
      )}
    </div>
  );
}
