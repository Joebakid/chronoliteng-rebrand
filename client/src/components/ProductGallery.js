"use client";

import { useMemo, useState } from "react";

export default function ProductGallery({ imageUrls = [], fallbackUrl = "", className = "", colorIndicators = [] }) {
  const sources = useMemo(() => {
    if (Array.isArray(imageUrls) && imageUrls.length) {
      return imageUrls;
    }
    if (fallbackUrl) {
      return [fallbackUrl];
    }
    return [];
  }, [imageUrls, fallbackUrl]);

  const [currentIndex, setCurrentIndex] = useState(0);

  if (!sources.length) {
    return null;
  }

  const showNav = sources.length > 1;

  const handlePrev = () =>
    setCurrentIndex((prev) => (prev - 1 + sources.length) % sources.length);
  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % sources.length);

  return (
    <div className={`relative flex h-full w-full items-center justify-center ${className}`}>
      <img
        src={sources[currentIndex]}
        alt={`Product image ${currentIndex + 1}`}
        className="h-full w-full rounded-[15%] object-cover"
      />
      {sources.length > 1 && (
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-[rgba(0,0,0,0.55)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--surface-strong)]">
          {currentIndex + 1}/{sources.length}
        </span>
      )}
      {showNav && (
        <>
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Previous image"
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-[rgba(255,255,255,0.12)] p-2 text-lg text-[var(--surface-strong)] transition hover:bg-[rgba(255,255,255,0.25)]"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={handleNext}
        aria-label="Next image"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-[rgba(255,255,255,0.12)] p-2 text-lg text-[var(--surface-strong)] transition hover:bg-[rgba(255,255,255,0.25)]"
      >
        ›
      </button>
          <div className="absolute bottom-3 flex gap-2">
            {sources.map((_, index) => (
              <button
                key={index}
            type="button"
            onClick={() => setCurrentIndex(index)}
            aria-label={`Show image ${index + 1}`}
                  className={`h-2.5 w-2.5 rounded-full border border-white/20 transition ${
                    index === currentIndex ? "bg-[var(--foreground)]" : "bg-[rgba(255,255,255,0.4)]"
                  }`}
                />
            ))}
          </div>
        </>
      )}
      {Array.isArray(colorIndicators) && colorIndicators.length > 0 && (
        <div className="absolute right-3 top-3 flex gap-2">
          {colorIndicators.map((color, index) => (
            <span
              key={index}
              className="h-2.5 w-2.5 rounded-full border border-white/20"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
