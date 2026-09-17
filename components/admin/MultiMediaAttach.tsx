"use client";

import { MediaAttach } from "./MediaAttach";

/** Multiple image attachments for galleries / news */
export function MultiMediaAttach({
  value,
  onChange,
  label = "Фото",
  max = 8,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  max?: number;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted">{label}</p>
      <div className="flex flex-wrap gap-3">
        {value.map((url, i) => (
          <MediaAttach
            key={`${url}-${i}`}
            value={url}
            label={`#${i + 1}`}
            onChange={(next) => {
              if (!next) onChange(value.filter((_, j) => j !== i));
              else onChange(value.map((u, j) => (j === i ? next : u)));
            }}
          />
        ))}
        {value.length < max && (
          <MediaAttach
            value={null}
            label="+"
            onChange={(url) => {
              if (url) onChange([...value, url]);
            }}
          />
        )}
      </div>
    </div>
  );
}
