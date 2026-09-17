"use client";

import { useTranslations } from "next-intl";

type Props = {
  brand: string;
  instagram: string;
  telegram: string;
  telegramBot?: string;
};

export function Footer({ brand, instagram, telegram, telegramBot }: Props) {
  const t = useTranslations("footer");
  return (
    <footer className="border-t border-white/8 px-4 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-2xl text-cream">{brand}</p>
          <p className="mt-2 text-sm text-muted">
            © {new Date().getFullYear()} {brand}. {t("rights")}
          </p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-muted">
          <a href={instagram} target="_blank" rel="noreferrer" className="transition hover:text-gold">
            Instagram
          </a>
          <a href={telegram} target="_blank" rel="noreferrer" className="transition hover:text-gold">
            Telegram
          </a>
          {telegramBot && (
            <a href={telegramBot} target="_blank" rel="noreferrer" className="transition hover:text-gold">
              {t("bot")}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
