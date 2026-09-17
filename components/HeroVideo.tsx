"use client";

import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type Props = {
  brand?: string;
  instagram: string;
};

export function HeroVideo({ brand = "Dr.Meedina", instagram }: Props) {
  const t = useTranslations("hero");

  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={
            process.env.NEXT_PUBLIC_HERO_VIDEO_URL ||
            "https://cdn.coverr.co/videos/coverr-a-woman-getting-a-facial-massage-2753/1080p.mp4"
          }
          autoPlay
          muted
          loop
          playsInline
          poster="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1600&q=80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/60 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-32 md:px-6 md:pb-28">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-xs uppercase tracking-[0.28em] text-white/70"
        >
          {t("eyebrow")}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.08 }}
          className="mt-4 font-display text-5xl text-white md:text-7xl lg:text-8xl"
        >
          {brand}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18 }}
          className="mt-5 max-w-xl font-display text-2xl text-white/95 md:text-3xl"
        >
          {t("headline")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.28 }}
          className="mt-4 max-w-md text-sm leading-relaxed text-white/75 md:text-base"
        >
          {t("sub")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.38 }}
          className="mt-9 flex flex-wrap gap-3"
        >
          <Link href="/booking" className="btn-primary">
            {t("cta")}
          </Link>
          <a
            href={instagram}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center border border-white/35 px-7 py-3 text-xs uppercase tracking-[0.18em] text-white/90 transition hover:border-white hover:bg-white/10"
          >
            {t("ctaSecondary")}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
