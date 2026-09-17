import { Suspense } from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { BookingWizard } from "@/components/BookingWizard";
import { Reveal } from "@/components/Reveal";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "booking" });

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-28 md:px-6">
      <Reveal>
        <h1 className="font-display text-5xl text-charcoal">{t("title")}</h1>
      </Reveal>
      <div className="mt-10">
        <Suspense fallback={<p className="text-muted">…</p>}>
          <BookingWizard />
        </Suspense>
      </div>
    </div>
  );
}
