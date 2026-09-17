"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { Download, FileImage, QrCode } from "lucide-react";
import { studioConfig } from "@/lib/studio-config";

export type ReceiptBooking = {
  id: string;
  clientName: string;
  clientPhone: string;
  startsAt: string;
  status: string;
  checkToken: string;
  service: { nameRu: string; nameUz?: string; nameEn?: string };
  master: { name: string };
};

type Labels = {
  title: string;
  client: string;
  phone: string;
  service: string;
  master: string;
  when: string;
  status: string;
  qrHint: string;
  downloadPng: string;
  downloadPdf: string;
  checkIn?: string;
};

const DEFAULT_LABELS: Labels = {
  title: "Чек записи",
  client: "Клиент",
  phone: "Телефон",
  service: "Услуга",
  master: "Врач",
  when: "Когда",
  status: "Статус",
  qrHint: "Покажите этот QR в клинике — одноразовый check-in",
  downloadPng: "Скачать PNG",
  downloadPdf: "Скачать PDF",
  checkIn: "Check-in",
};

type Props = {
  booking: ReceiptBooking;
  labels?: Partial<Labels>;
  /** Admin-only: mark SERVED from dashboard */
  showCheckIn?: boolean;
  serviceName?: string;
  onCheckIn?: () => void;
};

export function BookingReceipt({
  booking,
  labels: labelsProp,
  showCheckIn = false,
  serviceName,
  onCheckIn,
}: Props) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const ref = useRef<HTMLDivElement>(null);
  const [qr, setQr] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkMsg, setCheckMsg] = useState("");

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const checkUrl = `${origin}/admin/checkin?token=${booking.checkToken}`;

  useEffect(() => {
    QRCode.toDataURL(checkUrl, {
      width: 220,
      margin: 1,
      color: { dark: "#1a1510", light: "#fff8f0" },
    }).then(setQr);
  }, [checkUrl]);

  const local = toZonedTime(new Date(booking.startsAt), studioConfig.timezone);
  const svc = serviceName || booking.service.nameRu;

  async function downloadPng() {
    if (!ref.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(ref.current, { pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `receipt-${booking.id.slice(0, 8)}.png`;
      a.click();
    } finally {
      setBusy(false);
    }
  }

  async function downloadPdf() {
    if (!ref.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(ref.current, { pixelRatio: 2 });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
      const w = pdf.internal.pageSize.getWidth();
      const h = pdf.internal.pageSize.getHeight();
      pdf.addImage(dataUrl, "PNG", 0, 0, w, h);
      pdf.save(`receipt-${booking.id.slice(0, 8)}.pdf`);
    } finally {
      setBusy(false);
    }
  }

  async function doCheckIn() {
    setCheckMsg("");
    const res = await fetch("/api/admin/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: booking.checkToken }),
    });
    const data = await res.json();
    if (!res.ok) {
      setCheckMsg(data.error === "ALREADY_SERVED" ? "Уже отмечено" : "Ошибка");
      return;
    }
    setCheckMsg("Клиент отмечен (SERVED)");
    onCheckIn?.();
  }

  return (
    <div className="space-y-3">
      <div
        ref={ref}
        className="mx-auto max-w-sm bg-[#fff8f0] p-6 text-[#1a1510] shadow-lg"
        style={{ fontFamily: "Georgia, serif" }}
      >
        <p className="text-center text-xs uppercase tracking-[0.25em] text-[#8a6a3d]">Dr.Meedina</p>
        <h3 className="mt-2 text-center text-2xl">{labels.title}</h3>
        <div className="mt-5 space-y-2 text-sm leading-relaxed">
          <p>
            <span className="opacity-60">{labels.client}:</span> {booking.clientName}
          </p>
          <p>
            <span className="opacity-60">{labels.phone}:</span> {booking.clientPhone}
          </p>
          <p>
            <span className="opacity-60">{labels.service}:</span> {svc}
          </p>
          <p>
            <span className="opacity-60">{labels.master}:</span> {booking.master.name}
          </p>
          <p>
            <span className="opacity-60">{labels.when}:</span> {format(local, "dd.MM.yyyy HH:mm")}
          </p>
          <p>
            <span className="opacity-60">{labels.status}:</span> {booking.status}
          </p>
        </div>
        {qr && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="QR" className="mx-auto mt-5 h-40 w-40" />
        )}
        <p className="mt-2 text-center text-[10px] leading-snug opacity-60">{labels.qrHint}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={downloadPng}
          className="inline-flex items-center gap-2 border border-gold/50 px-4 py-2 text-xs uppercase tracking-wider text-gold transition hover:bg-gold/10"
        >
          <FileImage className="h-3.5 w-3.5" /> {labels.downloadPng}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={downloadPdf}
          className="inline-flex items-center gap-2 border border-gold/50 px-4 py-2 text-xs uppercase tracking-wider text-gold transition hover:bg-gold/10"
        >
          <Download className="h-3.5 w-3.5" /> {labels.downloadPdf}
        </button>
        {showCheckIn && booking.status !== "SERVED" && booking.status !== "CANCELLED" && (
          <button
            type="button"
            onClick={doCheckIn}
            className="inline-flex items-center gap-1 text-xs text-emerald-300"
          >
            <QrCode className="h-3.5 w-3.5" /> {labels.checkIn}
          </button>
        )}
      </div>
      {checkMsg && <p className="text-center text-xs text-gold">{checkMsg}</p>}
    </div>
  );
}
