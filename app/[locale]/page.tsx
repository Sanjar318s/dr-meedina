import { setRequestLocale, getTranslations } from "next-intl/server";
import { HeroVideo } from "@/components/HeroVideo";
import { Reveal } from "@/components/Reveal";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { pickName, pickDescription, formatPrice } from "@/lib/i18n-fields";
import type { AppLocale } from "@/lib/studio-config";
import { studioConfig } from "@/lib/studio-config";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as AppLocale;
  const t = await getTranslations({ locale, namespace: "about" });
  const ts = await getTranslations({ locale, namespace: "services" });
  const tm = await getTranslations({ locale, namespace: "masters" });
  const tr = await getTranslations({ locale, namespace: "reviews" });
  const tc = await getTranslations({ locale, namespace: "contacts" });
  const th = await getTranslations({ locale, namespace: "hero" });

  let services: Awaited<ReturnType<typeof prisma.service.findMany>> = [];
  let masters: Awaited<ReturnType<typeof prisma.master.findMany>> = [];
  try {
    [services, masters] = await Promise.all([
      prisma.service.findMany({
        where: { isActive: true },
        take: 3,
        orderBy: { price: "asc" },
      }),
      prisma.master.findMany({ where: { isActive: true }, take: 1 }),
    ]);
  } catch {
    /* DB may be unavailable */
  }

  const reviews = tr.raw("items") as { name: string; text: string }[];
  const master = masters[0];

  return (
    <>
      <HeroVideo />

      <section className="mx-auto max-w-6xl px-4 py-24 md:px-6 md:py-28">
        <Reveal>
          <p className="text-xs tracking-[0.25em] uppercase text-gold-dim">
            {studioConfig.brand}
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl text-charcoal md:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-6 max-w-2xl text-muted leading-relaxed">{t("text")}</p>
        </Reveal>
      </section>

      <section className="relative overflow-hidden py-24 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-blush/40 via-mist/30 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 md:px-6">
          <Reveal>
            <h2 className="font-display text-4xl text-charcoal md:text-5xl">
              {ts("title")}
            </h2>
            <p className="mt-3 text-muted">{ts("subtitle")}</p>
          </Reveal>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {services.map((s, i) => (
              <Reveal key={s.id} className={i === 1 ? "md:mt-10" : ""}>
                <article className="group">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    {s.imageUrl && (
                      <Image
                        src={s.imageUrl}
                        alt={pickName(s, loc)}
                        fill
                        className="object-cover transition duration-700 group-hover:scale-[1.03]"
                        sizes="(max-width:768px) 100vw, 33vw"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/75 via-charcoal/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                      <h3 className="font-display text-2xl">{pickName(s, loc)}</h3>
                      <p className="mt-1 text-sm text-white/75 line-clamp-2">
                        {pickDescription(s, loc)}
                      </p>
                      <p className="mt-3 text-sm text-gold">
                        {ts("from")} {formatPrice(s.price, loc)}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/booking?service=${s.id}`}
                    className="mt-4 inline-block text-sm tracking-[0.16em] uppercase text-gold-dim transition hover:text-charcoal"
                  >
                    {ts("select")} →
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-12">
            <Link
              href="/services"
              className="text-sm text-muted underline-offset-4 hover:text-charcoal hover:underline"
            >
              {ts("title")} →
            </Link>
          </Reveal>
        </div>
      </section>

      {master && (
        <section className="mx-auto max-w-6xl px-4 py-24 md:px-6 md:py-28">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <Reveal>
              <div className="relative aspect-[4/5] overflow-hidden md:aspect-[3/4]">
                {master.photoUrl && (
                  <Image
                    src={master.photoUrl}
                    alt={master.name}
                    fill
                    className="object-cover"
                    sizes="(max-width:768px) 100vw, 50vw"
                    priority
                  />
                )}
              </div>
            </Reveal>
            <Reveal>
              <p className="text-xs tracking-[0.25em] uppercase text-gold-dim">
                {tm("title")}
              </p>
              <h2 className="mt-3 font-display text-4xl text-charcoal md:text-5xl">
                {master.name}
              </h2>
              <p className="mt-2 text-gold-dim">
                {loc === "uz"
                  ? master.specializationUz
                  : loc === "en"
                    ? master.specializationEn
                    : master.specializationRu}
              </p>
              <p className="mt-5 text-muted leading-relaxed">
                {loc === "uz"
                  ? master.bioUz
                  : loc === "en"
                    ? master.bioEn
                    : master.bioRu}
              </p>
              <Link href="/booking" className="btn-primary mt-8">
                {th("cta")}
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      <section className="py-24 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Reveal>
            <h2 className="font-display text-4xl text-charcoal md:text-5xl">
              {tr("title")}
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {reviews.map((r) => (
              <Reveal key={r.name}>
                <blockquote className="border-l border-gold/50 pl-5">
                  <p className="text-muted leading-relaxed">&ldquo;{r.text}&rdquo;</p>
                  <footer className="mt-4 text-sm tracking-wide text-gold-dim">
                    {r.name}
                  </footer>
                </blockquote>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-28 md:px-6">
        <Reveal>
          <div className="relative overflow-hidden px-6 py-14 md:px-12 md:py-16">
            <div className="absolute inset-0 bg-gradient-to-br from-charcoal via-[#2a2420] to-[#3a3028]" />
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
            <div className="relative">
              <h2 className="font-display text-4xl text-pearl md:text-5xl">
                {tc("title")}
              </h2>
              <p className="mt-3 text-pearl/70">{tc("subtitle")}</p>
              <div className="mt-8 flex flex-col gap-3 text-pearl/80 sm:flex-row sm:flex-wrap sm:gap-8">
                <p>
                  <span className="text-pearl/50">{tc("address")}: </span>
                  {studioConfig.address[loc]}
                </p>
                <a
                  href={studioConfig.socials.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-gold transition"
                >
                  Instagram @dr.meedina
                </a>
                <a
                  href={studioConfig.socials.telegram}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-gold transition"
                >
                  t.me/drmeedina
                </a>
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  href="/booking"
                  className="inline-flex border border-gold bg-gold px-7 py-3 text-xs tracking-[0.18em] uppercase text-white transition hover:bg-gold-dim"
                >
                  {th("cta")}
                </Link>
                <a
                  href={studioConfig.socials.telegram}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex border border-white/30 px-7 py-3 text-xs tracking-[0.18em] uppercase text-pearl transition hover:border-white"
                >
                  {tc("bot")}
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
