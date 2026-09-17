"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  lat: number;
  lng: number;
  onConfirm: (coords: { lat: number; lng: number; addressHint?: string }) => void;
};

export function MapPicker({ lat, lng, onConfirm }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [pending, setPending] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat || 41.33, lng || 69.28],
      zoom: 15,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    const icon = L.divIcon({
      className: "",
      html: `<div style="width:18px;height:18px;border-radius:50%;background:#c6a75e;border:2px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.45)"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    const marker = L.marker([lat || 41.33, lng || 69.28], { icon, draggable: true }).addTo(map);
    marker.on("dragend", () => {
      const p = marker.getLatLng();
      setPending({ lat: +p.lat.toFixed(6), lng: +p.lng.toFixed(6) });
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      const next = { lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) };
      marker.setLatLng(next);
      setPending(next);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // init once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (pending) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng], mapRef.current.getZoom());
  }, [lat, lng, pending]);

  async function confirmPoint() {
    const coords = pending || { lat, lng };
    setBusy(true);
    let addressHint: string | undefined;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}&accept-language=ru`,
        { headers: { Accept: "application/json" } },
      );
      if (res.ok) {
        const data = await res.json();
        addressHint = data.display_name as string | undefined;
      }
    } catch {
      /* optional */
    } finally {
      setBusy(false);
    }
    onConfirm({ ...coords, addressHint });
    setPending(null);
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-muted">
        Кликните по карте или перетащите метку. Затем нажмите «Подтвердить точку» — координаты и адрес
        подставятся в поля выше. На сайте карта останется Яндекс.
      </p>
      <div ref={containerRef} className="h-72 w-full overflow-hidden ring-1 ring-white/10 z-0" />
      {pending && (
        <p className="text-xs text-gold">
          Выбрано: {pending.lat}, {pending.lng} — подтвердите
        </p>
      )}
      <button
        type="button"
        className="btn-primary !py-2 text-xs"
        disabled={busy}
        onClick={() => void confirmPoint()}
      >
        {busy ? "…" : "Подтвердить точку"}
      </button>
    </div>
  );
}
