import { setRequestLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { pickName, pickDescription, formatPrice } from "@/lib/i18n-fields";
import type { AppLocale } from "@/lib/studio-config";
import { Reveal } from "@/components/Reveal";

export const dynamic = "force-dynamic";

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as AppLocale;
  const t = await getTranslations({ locale, namespace: "services" });

  let services: Awaited<ReturnType<typeof prisma.service.findMany>> = [];
  try {
    services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });
  } catch {
    /* empty */
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-6">
      <Reveal>
        <h1 className="font-display text-5xl text-charcoal">{t("title")}</h1>
        <p className="mt-3 text-muted">{t("subtitle")}</p>
      </Reveal>
      <div className="mt-14 grid gap-12 sm:grid-cols-2">
        {services.map((s) => (
          <Reveal key={s.id}>
            <article>
              <div className="relative aspect-[16/10] overflow-hidden">
                {s.imageUrl && (
                  <Image
                    src={s.imageUrl}
                    alt={pickName(s, loc)}
                    fill
                    className="object-cover"
                    sizes="(max-width:768px) 100vw, 50vw"
                  />
                )}
              </div>
              <h2 className="mt-5 font-display text-3xl text-charcoal">
                {pickName(s, loc)}
              </h2>
              <p className="mt-2 text-muted leading-relaxed">
                {pickDescription(s, loc)}
              </p>
              <p className="mt-3 text-sm text-sand">
                {t("duration", { minutes: s.durationMinutes })} ·{" "}
                <span className="text-gold-dim">{formatPrice(s.price, loc)}</span>
              </p>
              <Link href={`/booking?service=${s.id}`} className="btn-ghost mt-5">
                {t("select")}
              </Link>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
