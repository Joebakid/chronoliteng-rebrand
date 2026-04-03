"use client";

import { useState, useRef, useEffect } from "react";

export default function ImageUploader({
  existingImages = [],
  imagePreviews = [],
  onAddFiles,
  onRemoveExisting,
  onRemoveNew,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const inputRef = useRef(null);

  // 1. Combine images into one array for the UI
  const allImages = [
    ...existingImages.map((url) => ({ url, type: "existing" })),
    ...imagePreviews.map((url) => ({ url, type: "new" })),
  ];

  const activeImg = allImages[activeIndex]?.url ?? null;

  // 2. CRITICAL FIX: Ensure activeIndex doesn't go out of bounds 
  // if an image is deleted or the list changes.
  useEffect(() => {
    if (activeIndex >= allImages.length && allImages.length > 0) {
      setActiveIndex(allImages.length - 1);
    } else if (allImages.length === 0) {
      setActiveIndex(0);
    }
  }, [allImages.length, activeIndex]);

  const handleRemove = (index) => {
    const item = allImages[index];
    const existingCount = existingImages.length;
    
    if (item.type === "existing") {
      onRemoveExisting(index);
    } else {
      // Correctly calculate the index relative to the new images array
      onRemoveNew(index - existingCount);
    }
  };

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    onAddFiles(e);
    // Set active index to the first of the newly added images
    setActiveIndex(allImages.length);
  };

  return (
    <>
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" alt="" />
          <button className="absolute top-6 right-6 text-white text-3xl">×</button>
        </div>
      )}

      <div className="space-y-2">
        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--muted)] ml-0.5">
          Images
        </span>

        <div className="flex gap-3">
          {/* Thumbnail strip */}
          <div className="flex flex-col gap-2 w-[72px] max-h-[400px] flex-shrink-0 overflow-y-auto no-scrollbar pb-2">
            {allImages.map((img, i) => (
              <div
                key={`${img.type}-${i}-${img.url.slice(-10)}`} // More unique key to prevent React recycle errors
                onClick={() => setActiveIndex(i)}
                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
                  activeIndex === i
                    ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/20 opacity-100 scale-105 z-10"
                    : "border-[var(--border)] opacity-60 hover:opacity-100"
                }`}
              >
                <img src={img.url} className="h-full w-full object-cover" alt="" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(i); }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-[12px] flex items-center justify-center hover:bg-red-500 transition-colors z-20"
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
              className="aspect-square rounded-xl border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all flex-shrink-0"
            >
              <span className="text-[var(--muted)] text-xl leading-none">+</span>
            </div>
          </div>

          {/* Main preview */}
          <div className="flex-1 min-h-[320px] rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]/40 overflow-hidden relative group">
            {activeImg ? (
              <>
                <img
                  src={activeImg}
                  className="h-full w-full object-contain cursor-zoom-in transition-transform duration-500 group-hover:scale-[1.02]"
                  style={{ minHeight: 320 }}
                  onClick={() => setLightbox(activeImg)}
                  alt=""
                  // If the image fails to load, don't show the broken icon
                  onError={(e) => {
                    e.target.src = "https://placehold.co/600x600/1a1a1a/666666?text=Preview+Unavailable";
                  }}
                />
                <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                  {activeIndex + 1} / {allImages.length}
                </div>
                <div className="absolute top-3 right-3 bg-black/50 text-white text-[9px] px-2.5 py-1 rounded-full backdrop-blur-sm uppercase tracking-widest font-bold border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  Tap to expand
                </div>
              </>
            ) : (
              <div
                className="h-full flex flex-col items-center justify-center gap-3 cursor-pointer"
                style={{ minHeight: 320 }}
                onClick={() => inputRef.current?.click()}
              >
                <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-[var(--border)] flex items-center justify-center text-3xl text-[var(--muted)]">
                  +
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">Add Product Photos</p>
                  <p className="text-[9px] text-[var(--muted)] opacity-60 mt-1">PNG, JPG or WEBP supported</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <input ref={inputRef} type="file" multiple accept="image/*" onChange={handleFiles} className="hidden" />

        {allImages.length > 0 && (
          <p className="text-[9px] text-[var(--muted)] text-center font-medium mt-2">
            {allImages.length} photo{allImages.length !== 1 ? "s" : ""} · Drag to reorder (Coming Soon) · First image is main
          </p>
        )}
      </div>
    </>
  );
}