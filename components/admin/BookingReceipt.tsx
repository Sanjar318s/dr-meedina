"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { Download, FileImage, QrCode } from "lucide-react";
import { studioConfig } from "@/lib/studio-config";

type Props = {
  booking: {
    id: string;
    clientName: string;
    clientPhone: string;
    startsAt: string;
    status: string;
    checkToken: string;
    service: { nameRu: string };
    master: { name: string };
  };
  onCheckIn?: () => void;
};

export function BookingReceipt({ booking, onCheckIn }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [qr, setQr] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkMsg, setCheckMsg] = useState("");

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const checkUrl = `${origin}/admin/checkin?token=${booking.checkToken}`;

  useEffect(() => {
    QRCode.toDataURL(checkUrl, { width: 220, margin: 1, color: { dark: "#1a1510", light: "#fff8f0" } }).then(
      setQr,
    );
  }, [checkUrl]);

  const local = toZonedTime(new Date(booking.startsAt), studioConfig.timezone);

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
    <div className="space-y-3 border border-white/10 bg-white/[0.03] p-4">
      <div
        ref={ref}
        className="mx-auto max-w-sm bg-[#fff8f0] p-6 text-[#1a1510]"
        style={{ fontFamily: "Georgia, serif" }}
      >
        <p className="text-center text-xs uppercase tracking-[0.25em] text-[#8a6a3d]">Dr.Meedina</p>
        <h3 className="mt-2 text-center text-2xl">Чек записи</h3>
        <div className="mt-5 space-y-2 text-sm leading-relaxed">
          <p>
            <span className="opacity-60">Клиент:</span> {booking.clientName}
          </p>
          <p>
            <span className="opacity-60">Телефон:</span> {booking.clientPhone}
          </p>
          <p>
            <span className="opacity-60">Услуга:</span> {booking.service.nameRu}
          </p>
          <p>
            <span className="opacity-60">Врач:</span> {booking.master.name}
          </p>
          <p>
            <span className="opacity-60">Когда:</span> {format(local, "dd.MM.yyyy HH:mm")}
          </p>
          <p>
            <span className="opacity-60">Статус:</span> {booking.status}
          </p>
        </div>
        {qr && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="QR" className="mx-auto mt-5 h-40 w-40" />
        )}
        <p className="mt-2 text-center text-[10px] opacity-50">QR для check-in в клинике</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={downloadPng} className="inline-flex items-center gap-1 text-xs text-gold">
          <FileImage className="h-3.5 w-3.5" /> PNG
        </button>
        <button type="button" disabled={busy} onClick={downloadPdf} className="inline-flex items-center gap-1 text-xs text-gold">
          <Download className="h-3.5 w-3.5" /> PDF
        </button>
        {booking.status !== "SERVED" && booking.status !== "CANCELLED" && (
          <button type="button" onClick={doCheckIn} className="inline-flex items-center gap-1 text-xs text-emerald-300">
            <QrCode className="h-3.5 w-3.5" /> Check-in
          </button>
        )}
      </div>
      {checkMsg && <p className="text-xs text-gold">{checkMsg}</p>}
    </div>
  );
}
