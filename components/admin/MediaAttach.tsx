"use client";

import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import imageCompression from "browser-image-compression";
import { ImagePlus, Loader2, Pencil, Trash2, Video } from "lucide-react";

type Props = {
  value?: string | null;
  onChange: (url: string | null) => void;
  kind?: "image" | "video";
  aspect?: number;
  label?: string;
};

async function getCroppedBlob(imageSrc: string, crop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/jpeg", 0.92);
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.crossOrigin = "anonymous";
    img.src = url;
  });
}

export function MediaAttach({
  value,
  onChange,
  kind = "image",
  aspect = 16 / 10,
  label = "Прикрепить",
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rawUrl, setRawUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, area: Area) => setCroppedArea(area), []);

  async function uploadBlob(blob: Blob, filename: string) {
    const form = new FormData();
    form.append("file", blob, filename);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || "upload failed");
    return data.url as string;
  }

  async function onPick(file: File) {
    setError("");
    if (kind === "video") {
      setBusy(true);
      try {
        const url = await uploadBlob(file, file.name);
        onChange(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка загрузки");
      } finally {
        setBusy(false);
      }
      return;
    }
    setRawUrl(URL.createObjectURL(file));
  }

  async function confirmCrop() {
    if (!rawUrl || !croppedArea) return;
    setBusy(true);
    setError("");
    try {
      const cropped = await getCroppedBlob(rawUrl, croppedArea);
      const file = new File([cropped], "crop.jpg", { type: "image/jpeg" });
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1600,
        maxSizeMB: 1.2,
        useWebWorker: true,
        fileType: "image/webp",
      });
      const url = await uploadBlob(compressed, "image.webp");
      onChange(url);
      setRawUrl(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative overflow-hidden ring-1 ring-white/10">
          {kind === "video" ? (
            <video src={value} className="max-h-40 w-full object-cover" controls />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="max-h-40 w-full object-cover" />
          )}
          <div className="absolute right-2 top-2 flex gap-1">
            <button type="button" className="bg-ink/80 p-1.5 text-cream" onClick={() => onChange(null)}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      <label className="btn-ghost !cursor-pointer !py-2 text-xs">
        {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : kind === "video" ? <Video className="mr-2 h-3.5 w-3.5" /> : value ? <Pencil className="mr-2 h-3.5 w-3.5" /> : <ImagePlus className="mr-2 h-3.5 w-3.5" />}
        {busy ? "Загрузка…" : label}
        <input
          type="file"
          accept={kind === "video" ? "video/mp4,video/webm" : "image/*"}
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onPick(f);
            e.target.value = "";
          }}
        />
      </label>
      {error && <p className="text-xs text-red-300">{error}</p>}

      {rawUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg space-y-3 bg-ink p-4 ring-1 ring-white/15">
            <p className="text-sm text-cream">Обрежьте фото</p>
            <div className="relative h-64 w-full bg-black">
              <Cropper
                image={rawUrl}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex gap-2">
              <button type="button" className="btn-primary !py-2 text-xs" disabled={busy} onClick={() => void confirmCrop()}>
                Готово
              </button>
              <button type="button" className="btn-ghost !py-2 text-xs" onClick={() => setRawUrl(null)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
