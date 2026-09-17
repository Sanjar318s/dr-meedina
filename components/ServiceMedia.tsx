"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  alt: string;
  imageUrl?: string | null;
  gallery?: string[];
  videoUrl?: string | null;
  className?: string;
  aspectClass?: string;
};

export function ServiceMedia({
  alt,
  imageUrl,
  gallery = [],
  videoUrl,
  className = "",
  aspectClass = "aspect-[16/10]",
}: Props) {
  const images = gallery.length > 0 ? gallery : imageUrl ? [imageUrl] : [];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (videoUrl || images.length <= 1 || paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), 4000);
    return () => clearInterval(id);
  }, [images.length, paused, videoUrl]);

  if (videoUrl) {
    return (
      <div className={`relative overflow-hidden ${aspectClass} ${className}`}>
        <video
          src={videoUrl}
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
      </div>
    );
  }

  if (images.length === 0) {
    return <div className={`bg-white/5 ${aspectClass} ${className}`} />;
  }

  return (
    <div
      className={`relative overflow-hidden ${aspectClass} ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={images[index]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="absolute inset-0"
        >
          <Image
            src={images[index]}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width:768px) 100vw, 50vw"
          />
        </motion.div>
      </AnimatePresence>

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-ink/50 p-1.5 text-pearl backdrop-blur hover:bg-ink/70"
            onClick={(e) => {
              e.preventDefault();
              setIndex((i) => (i - 1 + images.length) % images.length);
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next"
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-ink/50 p-1.5 text-pearl backdrop-blur hover:bg-ink/70"
            onClick={(e) => {
              e.preventDefault();
              setIndex((i) => (i + 1) % images.length);
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={(e) => {
                  e.preventDefault();
                  setIndex(i);
                }}
                className={`h-1.5 w-1.5 rounded-full transition ${
                  i === index ? "bg-gold" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
