"use client";

import { useEffect, useState } from "react";

type Item = { id: string; textUz: string; textRu: string; textEn: string };

export function NewsTicker({ locale }: { locale: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetch("/api/ticker")
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  }, []);

  if (!items.length) return null;

  const text = (it: Item) =>
    locale === "uz" ? it.textUz : locale === "en" ? it.textEn : it.textRu;

  const line = items.map((it) => text(it)).join("   ·   ");
  const doubled = `${line}   ·   ${line}   ·   `;

  return (
    <div
      className="relative overflow-hidden border-y border-gold/20 bg-gradient-to-r from-ink via-[#1a1612] to-ink py-3"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className={`inline-block min-w-full whitespace-nowrap text-sm tracking-wide text-gold/90 ${
          paused ? "[animation-play-state:paused]" : ""
        }`}
        style={{
          animation: "drm-ticker 42s linear infinite",
        }}
      >
        {doubled}
      </div>
    </div>
  );
}
