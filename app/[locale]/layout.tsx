import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSiteSettings } from "@/lib/site-settings";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "uz" | "ru" | "en")) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const settings = await getSiteSettings();

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="flex min-h-screen flex-col text-cream">
        <Header brand={settings.brand} />
        <main className="flex-1">{children}</main>
        <Footer
          brand={settings.brand}
          instagram={settings.socials.instagram}
          telegramBot={settings.socials.telegramBot}
        />
      </div>
    </NextIntlClientProvider>
  );
}
