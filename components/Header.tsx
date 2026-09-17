"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const locales = [
  { code: "uz", label: "UZ" },
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
] as const;

export function Header({ brand = "Dr.Meedina" }: { brand?: string }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: t("home") },
    { href: "/services", label: t("services") },
    { href: "/masters", label: t("masters") },
    { href: "/booking", label: t("booking") },
    { href: "/contacts", label: t("contacts") },
  ] as const;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="font-display text-2xl tracking-wide text-cream">
          {brand}
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm tracking-wide transition ${
                pathname === l.href ? "text-gold" : "text-muted hover:text-cream"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex gap-1 text-[11px] tracking-wider">
            {locales.map((l) => (
              <Link
                key={l.code}
                href={pathname}
                locale={l.code}
                className={`px-2 py-1 transition ${
                  locale === l.code ? "text-gold" : "text-sand hover:text-cream"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <button
            type="button"
            className="text-cream md:hidden"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="block h-0.5 w-6 bg-cream" />
            <span className="mt-1.5 block h-0.5 w-5 bg-cream" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/8 md:hidden"
          >
            <div className="flex flex-col gap-4 bg-ink/95 px-4 py-5">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="text-muted"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
