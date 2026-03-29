"use client";

import { useState, useRef } from "react";

export default function ImageUploader({
  existingImages,
  imagePreviews,
  onAddFiles,
  onRemoveExisting,
  onRemoveNew,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const inputRef = useRef(null);

  const allImages = [
    ...existingImages.map((url) => ({ url, type: "existing" })),
    ...imagePreviews.map((url) => ({ url, type: "new" })),
  ];

  const activeImg = allImages[activeIndex]?.url ?? null;

  const handleRemove = (index) => {
    const item = allImages[index];
    const existingCount = existingImages.length;
    if (item.type === "existing") {
      onRemoveExisting(index);
    } else {
      onRemoveNew(index - existingCount);
    }
    setActiveIndex((prev) => Math.max(0, prev - 1));
  };

  const handleFiles = (e) => {
    onAddFiles(e);
    setActiveIndex(allImages.length);
  };

  return (
    <>
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} className="max-h-[85vh] max-w-full rounded-2xl object-contain" alt="" />
        </div>
      )}

      <div className="space-y-2">
        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--muted)] ml-0.5">
          Images
        </span>

        <div className="flex gap-3">
          {/* Thumbnail strip */}
          <div className="flex flex-col gap-2 w-[72px] flex-shrink-0">
            {allImages.map((img, i) => (
              <div
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                  activeIndex === i
                    ? "border-[var(--accent)] opacity-100"
                    : "border-[var(--border)] opacity-60 hover:opacity-100"
                }`}
              >
                <img src={img.url} className="h-full w-full object-cover" alt="" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(i); }}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center leading-none hover:bg-red-500 transition-colors"
                >
                  ×
                </button>
                {img.type === "new" && (
                  <div className="absolute bottom-0 left-0 right-0 bg-[var(--accent)]/90 text-[7px] font-black text-black text-center py-0.5 uppercase tracking-wider">
                    New
                  </div>
                )}
              </div>
            ))}

            {/* Add button */}
            <div
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all"
            >
              <span className="text-[var(--muted)] text-xl leading-none">+</span>
            </div>
          </div>

          {/* Main preview */}
          <div className="flex-1 min-h-[260px] rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]/40 overflow-hidden relative">
            {activeImg ? (
              <>
                <img
                  src={activeImg}
                  className="h-full w-full object-cover cursor-zoom-in"
                  style={{ minHeight: 260 }}
                  onClick={() => setLightbox(activeImg)}
                  alt=""
                />
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {activeIndex + 1} / {allImages.length}
                </div>
                <div className="absolute top-2 right-2 bg-black/50 text-white text-[9px] px-2 py-0.5 rounded-full backdrop-blur-sm uppercase tracking-wider">
                  Tap to expand
                </div>
              </>
            ) : (
              <div
                className="h-full flex flex-col items-center justify-center gap-2 cursor-pointer"
                style={{ minHeight: 260 }}
                onClick={() => inputRef.current?.click()}
              >
                <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-[var(--border)] flex items-center justify-center text-2xl text-[var(--muted)]">
                  +
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Add Photos</p>
                <p className="text-[9px] text-[var(--muted)] opacity-60">First image is the main product photo</p>
              </div>
            )}
          </div>
        </div>

        <input ref={inputRef} type="file" multiple accept="image/*" onChange={handleFiles} className="hidden" />

        {allImages.length > 0 && (
          <p className="text-[9px] text-[var(--muted)] text-center">
            {allImages.length} photo{allImages.length !== 1 ? "s" : ""} · First image shown as main product photo
          </p>
        )}
      </div>
    </>
  );
}
