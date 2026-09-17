import { setRequestLocale, getTranslations } from "next-intl/server";
import { HeroVideo } from "@/components/HeroVideo";
import { Reveal } from "@/components/Reveal";
import { NewsTicker } from "@/components/NewsTicker";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { pickName, pickDescription, formatPrice } from "@/lib/i18n-fields";
import type { AppLocale } from "@/lib/studio-config";
import { getSiteSettings, parseGallery } from "@/lib/site-settings";
import { ServiceMedia } from "@/components/ServiceMedia";
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
  const settings = await getSiteSettings();
  const aboutTitle = settings.aboutTitle[loc] || t("title");
  const aboutText = settings.aboutText[loc] || t("text");

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
      <HeroVideo
        brand={settings.brand}
        instagram={settings.socials.instagram}
        videoUrl={settings.heroVideoUrl}
        headline={settings.heroHeadline[loc]}
        sub={settings.heroSub[loc]}
        cta={th("cta")}
        ctaSecondary={th("ctaSecondary")}
      />

      <section className="mx-auto max-w-6xl px-4 py-24 md:px-6 md:py-28">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.25em] text-gold">{settings.brand}</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl text-cream md:text-5xl">
            {aboutTitle}
          </h2>
          <p className="mt-6 max-w-2xl leading-relaxed text-muted">{aboutText}</p>
        </Reveal>
      </section>

      <NewsTicker locale={locale} />

      <section className="relative overflow-hidden py-24 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 md:px-6">
          <Reveal>
            <h2 className="font-display text-4xl text-cream md:text-5xl">{ts("title")}</h2>
            <p className="mt-3 text-muted">{ts("subtitle")}</p>
          </Reveal>
          <div className="mt-14 grid items-stretch gap-10 md:grid-cols-3">
            {services.map((s) => (
              <Reveal key={s.id}>
                <article className="group flex h-full flex-col">
                  <ServiceMedia
                    alt={pickName(s, loc)}
                    imageUrl={s.imageUrl}
                    gallery={parseGallery(s.gallery)}
                    videoUrl={s.videoUrl}
                    aspectClass="aspect-[4/5]"
                    className="transition duration-500 group-hover:brightness-110"
                  />
                  <h3 className="mt-4 font-display text-2xl text-cream">{pickName(s, loc)}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{pickDescription(s, loc)}</p>
                  <p className="mt-3 text-sm text-gold">
                    {ts("from")} {formatPrice(s.price, loc)}
                  </p>
                  <Link
                    href={`/booking?service=${s.id}`}
                    className="mt-auto pt-4 text-sm uppercase tracking-[0.16em] text-gold transition hover:text-cream"
                  >
                    {ts("select")} →
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-12">
            <Link href="/services" className="text-sm text-muted hover:text-cream">
              {ts("title")} →
            </Link>
          </Reveal>
        </div>
      </section>

      {master && (
        <section className="mx-auto max-w-6xl px-4 py-24 md:px-6 md:py-28">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <Reveal>
              <div className="relative aspect-[4/5] overflow-hidden ring-1 ring-gold/30 md:aspect-[3/4]">
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
                <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent" />
              </div>
            </Reveal>
            <Reveal>
              <p className="text-xs uppercase tracking-[0.25em] text-gold">{tm("title")}</p>
              <h2 className="mt-3 font-display text-4xl text-cream md:text-5xl">{master.name}</h2>
              <p className="mt-2 text-gold">
                {loc === "uz"
                  ? master.specializationUz
                  : loc === "en"
                    ? master.specializationEn
                    : master.specializationRu}
              </p>
              <p className="mt-5 leading-relaxed text-muted">
                {loc === "uz" ? master.bioUz : loc === "en" ? master.bioEn : master.bioRu}
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
            <h2 className="font-display text-4xl text-cream md:text-5xl">{tr("title")}</h2>
          </Reveal>
          <div className="mt-14 grid gap-12 md:grid-cols-3">
            {reviews.map((r, i) => (
              <Reveal key={r.name} delay={i * 0.08}>
                <blockquote className="relative">
                  <span className="font-display text-5xl leading-none text-gold/40">&ldquo;</span>
                  <p className="mt-2 font-display text-xl leading-relaxed text-cream/90">
                    {r.text}
                  </p>
                  <footer className="mt-5 text-sm tracking-wide text-gold">{r.name}</footer>
                </blockquote>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-28 md:px-6">
        <Reveal>
          <div className="relative overflow-hidden px-6 py-14 md:px-12 md:py-16">
            <div className="absolute inset-0 bg-gradient-to-br from-[#161616] via-[#1c1814] to-[#241e18]" />
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />
            <div className="relative grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-end">
              <div>
                <h2 className="font-display text-4xl text-pearl md:text-5xl">{tc("title")}</h2>
                <p className="mt-3 text-pearl/70">{tc("subtitle")}</p>
                <div className="mt-8 flex flex-col gap-3 text-pearl/80 sm:flex-row sm:flex-wrap sm:gap-8">
                  <p>
                    <span className="text-pearl/50">{tc("address")}: </span>
                    {settings.address[loc]}
                  </p>
                  <a
                    href={settings.socials.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="transition hover:text-gold"
                  >
                    Instagram @dr.meedina
                  </a>
                  <a
                    href={settings.socials.telegram}
                    target="_blank"
                    rel="noreferrer"
                    className="transition hover:text-gold"
                  >
                    t.me/drmeedina
                  </a>
                </div>
                <div className="mt-10 flex flex-wrap gap-3">
                  <Link href="/booking" className="btn-primary">
                    {th("cta")}
                  </Link>
                  <a
                    href={settings.socials.telegramBot}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex border border-gold/60 bg-gold/15 px-7 py-3 text-xs uppercase tracking-[0.18em] text-gold transition hover:bg-gold hover:text-ink"
                  >
                    {tc("bookBot")}
                  </a>
                  <a
                    href={settings.socials.telegram}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex border border-white/30 px-7 py-3 text-xs uppercase tracking-[0.18em] text-pearl transition hover:border-white"
                  >
                    {tc("bot")}
                  </a>
                </div>
              </div>
              <p className="hidden text-right font-display text-6xl text-pearl/15 md:block">
                {settings.brand}
              </p>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
