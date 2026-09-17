"use client";

import { useTranslations } from "next-intl";
import { studioConfig } from "@/lib/studio-config";

export function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="border-t border-charcoal/8 px-4 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-2xl text-charcoal">{studioConfig.brand}</p>
          <p className="mt-2 text-sm text-muted">
            © {new Date().getFullYear()} {studioConfig.brand}. {t("rights")}
          </p>
        </div>
        <div className="flex gap-5 text-sm text-muted">
          <a
            href={studioConfig.socials.instagram}
            target="_blank"
            rel="noreferrer"
            className="hover:text-gold-dim transition"
          >
            Instagram
          </a>
          <a
            href={studioConfig.socials.telegram}
            target="_blank"
            rel="noreferrer"
            className="hover:text-gold-dim transition"
          >
            Telegram
          </a>
        </div>
      </div>
    </footer>
  );
}
