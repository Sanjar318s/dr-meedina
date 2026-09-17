"use client";

import { useState } from "react";
import { Check, Copy, MapPin } from "lucide-react";

type Props = {
  address: string;
  lat: number;
  lng: number;
  copyLabel: string;
  copiedLabel: string;
  mapsLabel: string;
};

export function AddressActions({
  address,
  lat,
  lng,
  copyLabel,
  copiedLabel,
  mapsLabel,
}: Props) {
  const [copied, setCopied] = useState(false);
  const yandexUrl = `https://yandex.ru/maps/?pt=${lng},${lat}&z=15&l=map`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" onClick={copy} className="btn-ghost !px-4 !py-2.5 text-[11px]">
        {copied ? (
          <>
            <Check className="mr-2 h-3.5 w-3.5" /> {copiedLabel}
          </>
        ) : (
          <>
            <Copy className="mr-2 h-3.5 w-3.5" /> {copyLabel}
          </>
        )}
      </button>
      <a
        href={yandexUrl}
        target="_blank"
        rel="noreferrer"
        className="btn-primary !px-4 !py-2.5 text-[11px]"
      >
        <MapPin className="mr-2 h-3.5 w-3.5" /> {mapsLabel}
      </a>
    </div>
  );
}
