"use client";

import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { studioConfig } from "@/lib/studio-config";

export function HeroVideo() {
  const t = useTranslations("hero");
  const videoId = process.env.NEXT_PUBLIC_HERO_YOUTUBE_ID || "JnT51BGOiJs";

  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <iframe
          title="dr.meedina atmosphere"
          className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 scale-[1.15] border-0"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&rel=0&modestbranding=1&showinfo=0`}
          allow="autoplay; encrypted-media"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1614]/80 via-[#1a1614]/35 to-[#1a1614]/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1614]/50 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-32 md:px-6 md:pb-28">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-xs tracking-[0.28em] uppercase text-white/70"
        >
          {t("eyebrow")}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.08 }}
          className="mt-4 font-display text-5xl text-white md:text-7xl lg:text-8xl"
        >
          {t("brand")}
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
            href={studioConfig.socials.instagram}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center border border-white/35 px-7 py-3 text-xs tracking-[0.18em] uppercase text-white/90 transition hover:border-white hover:bg-white/10"
          >
            {t("ctaSecondary")}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
