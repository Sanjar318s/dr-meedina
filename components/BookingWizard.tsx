"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { pickName, formatPrice } from "@/lib/i18n-fields";
import type { AppLocale } from "@/lib/studio-config";
import { BookingReceipt } from "@/components/admin/BookingReceipt";

type Service = {
  id: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  durationMinutes: number;
  price: number;
};

type Master = {
  id: string;
  name: string;
  specializationUz: string;
  specializationRu: string;
  specializationEn: string;
};

const steps = ["service", "master", "slot", "contacts", "confirm"] as const;

export function BookingWizard() {
  const t = useTranslations("booking");
  const locale = useLocale() as AppLocale;
  const search = useSearchParams();
  const preService = search.get("service");

  const [step, setStep] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [serviceId, setServiceId] = useState(preService || "");
  const [masterId, setMasterId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [skipMaster, setSkipMaster] = useState(false);
  const [dayOff, setDayOff] = useState(false);
  const [receipt, setReceipt] = useState<{
    id: string;
    clientName: string;
    clientPhone: string;
    startsAt: string;
    status: string;
    checkToken: string;
    service: { nameRu: string; nameUz?: string; nameEn?: string };
    master: { name: string };
  } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/services").then((r) => r.json()),
      fetch("/api/masters").then((r) => r.json()),
    ]).then(([s, m]) => {
      const listS = Array.isArray(s) ? s : [];
      const listM = Array.isArray(m) ? m : [];
      setServices(listS);
      setMasters(listM);
      if (listM.length === 1) {
        setMasterId(listM[0].id);
        setSkipMaster(true);
      }
      if (preService && listS.some((x: Service) => x.id === preService)) {
        setServiceId(preService);
        setStep(listM.length === 1 ? 2 : 1);
      }
    });
  }, [preService]);

  useEffect(() => {
    if (!masterId || !date || !serviceId) {
      setSlots([]);
      setDayOff(false);
      return;
    }
    setLoadingSlots(true);
    setTime("");
    fetch(`/api/slots?masterId=${masterId}&date=${date}&serviceId=${serviceId}`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data.slots) ? data.slots : [];
        setSlots(list);
        setDayOff(list.length === 0);
      })
      .finally(() => setLoadingSlots(false));
  }, [masterId, date, serviceId]);

  const service = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId],
  );
  const master = useMemo(
    () => masters.find((m) => m.id === masterId),
    [masters, masterId],
  );

  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const visibleSteps = useMemo(() => {
    if (!skipMaster) return [0, 1, 2, 3, 4];
    return [0, 2, 3, 4];
  }, [skipMaster]);

  const stepLabels = [
    t("stepService"),
    t("stepMaster"),
    t("stepSlot"),
    t("stepContacts"),
    t("stepConfirm"),
  ];

  function goNext() {
    if (step === 0 && skipMaster) {
      setStep(2);
      return;
    }
    setStep((s) => Math.min(4, s + 1));
  }

  function goBack() {
    if (step === 2 && skipMaster) {
      setStep(0);
      return;
    }
    setStep((s) => Math.max(0, s - 1));
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: name,
          clientPhone: phone,
          serviceId,
          masterId,
          date,
          time,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "error");
      }
      const body = await res.json();
      setReceipt({
        id: body.id,
        clientName: body.clientName,
        clientPhone: body.clientPhone,
        startsAt: body.startsAt,
        status: body.status,
        checkToken: body.checkToken,
        service: body.service,
        master: body.master,
      });
      setDone(true);
    } catch {
      setError(t("error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (done && receipt) {
    const svcName =
      locale === "uz"
        ? receipt.service.nameUz || receipt.service.nameRu
        : locale === "en"
          ? receipt.service.nameEn || receipt.service.nameRu
          : receipt.service.nameRu;
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 space-y-6"
      >
        <div>
          <p className="font-display text-3xl text-gold">{t("success")}</p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{t("successHint")}</p>
        </div>
        <BookingReceipt
          booking={receipt}
          serviceName={svcName}
          showCheckIn={false}
          labels={{
            title: t("receiptTitle"),
            client: t("receiptClient"),
            phone: t("receiptPhone"),
            service: t("receiptService"),
            master: t("receiptMaster"),
            when: t("receiptWhen"),
            status: t("receiptStatus"),
            qrHint: t("receiptQrHint"),
            downloadPng: t("downloadPng"),
            downloadPdf: t("downloadPdf"),
          }}
        />
      </motion.div>
    );
  }

  const progressIndex = visibleSteps.indexOf(step);
  const progressPct = ((progressIndex + 1) / visibleSteps.length) * 100;

  const canNext =
    (step === 0 && !!serviceId) ||
    (step === 1 && !!masterId) ||
    (step === 2 && !!date && !!time) ||
    (step === 3 && name.trim() && phone.trim().length >= 9);

  return (
    <div className="pb-24">
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm text-gold">{stepLabels[step]}</p>
          <p className="text-xs text-muted">
            {progressIndex + 1}/{visibleSteps.length}
          </p>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gold transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-4 flex gap-2">
          {visibleSteps.map((si, i) => (
            <div
              key={si}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                i < progressIndex
                  ? "bg-gold text-ink"
                  : i === progressIndex
                    ? "border border-gold text-gold"
                    : "border border-white/15 text-muted"
              }`}
            >
              {i < progressIndex ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={steps[step]}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          {step === 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((s) => {
                const active = serviceId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setServiceId(s.id);
                      setTimeout(() => goNext(), 120);
                    }}
                    className={`flex items-start justify-between gap-3 border px-4 py-4 text-left transition ${
                      active
                        ? "border-gold bg-gold/10"
                        : "border-white/10 bg-white/5 hover:border-gold/40"
                    }`}
                  >
                    <span>
                      <span className="block font-display text-xl text-cream">
                        {pickName(s, locale)}
                      </span>
                      <span className="mt-1 block text-sm text-muted">
                        {s.durationMinutes} min · {formatPrice(s.price, locale)}
                      </span>
                    </span>
                    {active && <Check className="mt-1 h-4 w-4 shrink-0 text-gold" />}
                  </button>
                );
              })}
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-3">
              {masters.map((m) => {
                const active = masterId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMasterId(m.id);
                      setTimeout(() => goNext(), 120);
                    }}
                    className={`flex items-start justify-between gap-3 border px-4 py-4 text-left transition ${
                      active
                        ? "border-gold bg-gold/10"
                        : "border-white/10 bg-white/5 hover:border-gold/40"
                    }`}
                  >
                    <span>
                      <span className="block font-display text-xl text-cream">{m.name}</span>
                      <span className="mt-1 block text-sm text-muted">
                        {locale === "uz"
                          ? m.specializationUz
                          : locale === "en"
                            ? m.specializationEn
                            : m.specializationRu}
                      </span>
                    </span>
                    {active && <Check className="mt-1 h-4 w-4 shrink-0 text-gold" />}
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <label className="block">
                <span className="text-sm text-muted">{t("date")}</span>
                <input
                  type="date"
                  min={minDate}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="admin-input mt-2"
                />
              </label>
              <div>
                <span className="text-sm text-muted">{t("time")}</span>
                {loadingSlots ? (
                  <p className="mt-3 text-muted">…</p>
                ) : slots.length === 0 && date ? (
                  <p className="mt-3 text-muted">{dayOff ? t("noSlots") : t("noSlots")}</p>
                ) : (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTime(slot)}
                        className={`border px-3 py-3 text-sm transition ${
                          time === slot
                            ? "border-gold bg-gold/10 text-gold"
                            : "border-white/12 text-muted hover:border-gold/50"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-md space-y-4">
              <label className="block">
                <span className="text-sm text-muted">{t("name")}</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="admin-input mt-2"
                />
              </label>
              <label className="block">
                <span className="text-sm text-muted">{t("phone")}</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 …"
                  className="admin-input mt-2"
                />
              </label>
            </div>
          )}

          {step === 4 && (
            <div className="max-w-md space-y-2 border border-white/10 bg-white/5 p-5 text-muted">
              <p className="text-cream">{t("summary")}</p>
              <p>
                {service && pickName(service, locale)} · {master?.name}
              </p>
              <p>
                {date} {time}
              </p>
              <p>
                {name} · {phone}
              </p>
              {error && <p className="text-red-400">{error}</p>}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/95 px-4 py-4 backdrop-blur md:static md:mt-10 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="mx-auto flex max-w-3xl gap-3">
          {step > 0 && (
            <button type="button" onClick={goBack} className="btn-ghost">
              {t("back")}
            </button>
          )}
          {step < 4 ? (
            step !== 0 && step !== 1 ? (
              <button
                type="button"
                disabled={!canNext}
                onClick={goNext}
                className="btn-primary disabled:opacity-40"
              >
                {t("next")}
              </button>
            ) : null
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={submit}
              className="btn-primary disabled:opacity-40"
            >
              {t("submit")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
