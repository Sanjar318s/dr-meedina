"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";

export function FieldHelp({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        className="ml-1 text-sand hover:text-gold"
        aria-label="Help"
        onClick={() => setOpen((v) => !v)}
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span className="absolute left-0 top-6 z-20 w-56 rounded border border-white/15 bg-ink p-2 text-[11px] leading-relaxed text-muted shadow-xl">
          {text}
          <button type="button" className="mt-1 block text-gold" onClick={() => setOpen(false)}>
            Понятно
          </button>
        </span>
      )}
    </span>
  );
}
