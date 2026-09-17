import { setRequestLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import type { AppLocale } from "@/lib/studio-config";
import { Reveal } from "@/components/Reveal";
import { pickSpecialization, pickBio } from "@/lib/i18n-fields";
import { Link } from "@/i18n/navigation";

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
        <h1 className="font-display text-5xl text-charcoal">{t("title")}</h1>
        <p className="mt-3 text-muted">{t("subtitle")}</p>
      </Reveal>

      {master && (
        <div className="mt-14 grid items-start gap-12 md:grid-cols-2">
          <Reveal>
            <div className="relative aspect-[3/4] overflow-hidden">
              {master.photoUrl && (
                <Image
                  src={master.photoUrl}
                  alt={master.name}
                  fill
                  className="object-cover"
                  sizes="50vw"
                />
              )}
            </div>
          </Reveal>
          <Reveal>
            <h2 className="font-display text-4xl text-charcoal">{master.name}</h2>
            <p className="mt-2 text-gold-dim">{pickSpecialization(master, loc)}</p>
            <p className="mt-6 text-muted leading-relaxed">{pickBio(master, loc)}</p>
            <Link href="/booking" className="btn-primary mt-8">
              {th("cta")}
            </Link>
          </Reveal>
        </div>
      )}
    </div>
  );
}
