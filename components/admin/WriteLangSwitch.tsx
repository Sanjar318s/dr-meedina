"use client";

export type WriteLang = "ru" | "uz" | "en";

export function WriteLangSwitch({
  value,
  onChange,
}: {
  value: WriteLang;
  onChange: (l: WriteLang) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-muted">Пишу на:</span>
      {(["ru", "uz", "en"] as WriteLang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={`px-3 py-1 uppercase tracking-wider ${
            value === l ? "bg-gold/20 text-gold ring-1 ring-gold/40" : "text-sand hover:text-cream"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export async function autoTranslate(
  text: string,
  from: WriteLang,
): Promise<Record<WriteLang, string>> {
  const to = (["ru", "uz", "en"] as WriteLang[]).filter((l) => l !== from);
  const res = await fetch("/api/admin/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, from, to }),
  });
  if (!res.ok) {
    return { ru: text, uz: text, en: text, [from]: text } as Record<WriteLang, string>;
  }
  const data = await res.json();
  return {
    ru: from === "ru" ? text : data.translations.ru || text,
    uz: from === "uz" ? text : data.translations.uz || text,
    en: from === "en" ? text : data.translations.en || text,
  };
}
