"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { pickName, formatPrice } from "@/lib/i18n-fields";
import type { AppLocale } from "@/lib/studio-config";

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

  useEffect(() => {
    Promise.all([
      fetch("/api/services").then((r) => r.json()),
      fetch("/api/masters").then((r) => r.json()),
    ]).then(([s, m]) => {
      setServices(Array.isArray(s) ? s : []);
      setMasters(Array.isArray(m) ? m : []);
      if (preService && Array.isArray(s) && s.some((x: Service) => x.id === preService)) {
        setServiceId(preService);
        setStep(1);
      }
    });
  }, [preService]);

  useEffect(() => {
    if (!masterId || !date || !serviceId) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    setTime("");
    fetch(`/api/slots?masterId=${masterId}&date=${date}&serviceId=${serviceId}`)
      .then((r) => r.json())
      .then((data) => setSlots(Array.isArray(data.slots) ? data.slots : []))
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
      setDone(true);
    } catch {
      setError(t("error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-10 font-display text-2xl text-gold-dim"
      >
        {t("success")}
      </motion.p>
    );
  }

  const stepLabels = [
    t("stepService"),
    t("stepMaster"),
    t("stepSlot"),
    t("stepContacts"),
    t("stepConfirm"),
  ];

  const optionClass = (active: boolean) =>
    `w-full border px-4 py-4 text-left transition ${
      active
        ? "border-gold bg-gold/10"
        : "border-charcoal/10 hover:border-gold/40 bg-white/40"
    }`;

  return (
    <div>
      <div className="mb-10 flex flex-wrap gap-2 text-xs tracking-widest text-sand">
        {stepLabels.map((label, i) => (
          <span
            key={label}
            className={i === step ? "text-gold-dim" : i < step ? "text-charcoal" : ""}
          >
            {i + 1}. {label}
            {i < stepLabels.length - 1 ? " ·" : ""}
          </span>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={steps[step]}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          {step === 0 && (
            <div className="grid gap-3">
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setServiceId(s.id)}
                  className={optionClass(serviceId === s.id)}
                >
                  <span className="font-display text-xl text-charcoal">
                    {pickName(s, locale)}
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    {s.durationMinutes} min · {formatPrice(s.price, locale)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-3">
              {masters.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMasterId(m.id)}
                  className={optionClass(masterId === m.id)}
                >
                  <span className="font-display text-xl text-charcoal">{m.name}</span>
                  <span className="mt-1 block text-sm text-muted">
                    {locale === "uz"
                      ? m.specializationUz
                      : locale === "en"
                        ? m.specializationEn
                        : m.specializationRu}
                  </span>
                </button>
              ))}
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
                  className="mt-2 w-full border border-charcoal/15 bg-white/50 px-3 py-2.5 text-charcoal outline-none focus:border-gold"
                />
              </label>
              <div>
                <span className="text-sm text-muted">{t("time")}</span>
                {loadingSlots ? (
                  <p className="mt-3 text-muted">…</p>
                ) : slots.length === 0 && date ? (
                  <p className="mt-3 text-muted">{t("noSlots")}</p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTime(slot)}
                        className={`border px-3 py-2 text-sm transition ${
                          time === slot
                            ? "border-gold text-gold-dim bg-gold/10"
                            : "border-charcoal/12 text-muted hover:border-gold/50"
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
                  className="mt-2 w-full border border-charcoal/15 bg-white/50 px-3 py-2.5 text-charcoal outline-none focus:border-gold"
                />
              </label>
              <label className="block">
                <span className="text-sm text-muted">{t("phone")}</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998"
                  className="mt-2 w-full border border-charcoal/15 bg-white/50 px-3 py-2.5 text-charcoal outline-none focus:border-gold"
                />
              </label>
            </div>
          )}

          {step === 4 && (
            <div className="max-w-md space-y-2 border border-charcoal/10 bg-white/50 p-5 text-muted">
              <p className="text-charcoal">{t("summary")}</p>
              <p>
                {service && pickName(service, locale)} · {master?.name}
              </p>
              <p>
                {date} {time}
              </p>
              <p>
                {name} · {phone}
              </p>
              {error && <p className="text-red-600">{error}</p>}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-10 flex gap-3">
        {step > 0 && (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-ghost">
            {t("back")}
          </button>
        )}
        {step < 4 ? (
          <button
            type="button"
            disabled={
              (step === 0 && !serviceId) ||
              (step === 1 && !masterId) ||
              (step === 2 && (!date || !time)) ||
              (step === 3 && (!name.trim() || phone.trim().length < 9))
            }
            onClick={() => setStep((s) => s + 1)}
            className="btn-primary disabled:opacity-40 disabled:hover:transform-none disabled:hover:shadow-none"
          >
            {t("next")}
          </button>
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
  );
}
