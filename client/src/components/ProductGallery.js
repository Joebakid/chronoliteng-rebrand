"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function ProductGallery({
  imageUrls = [],
  fallbackUrl = "",
  className = "",
  colorIndicators = [],
  onImageChange,
}) {
  const sources = useMemo(() => {
    if (Array.isArray(imageUrls) && imageUrls.length) return imageUrls;
    if (fallbackUrl) return [fallbackUrl];
    return [];
  }, [imageUrls, fallbackUrl]);

  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // --- NEW: Track video elements to manually trigger play/pause ---
  const videoRefs = useRef({}); 

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (onImageChange && sources[active]) {
      onImageChange(sources[active]);
    }
  }, [active, sources, onImageChange]);

  useEffect(() => {
    if (lightbox) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  // --- NEW: Play the active video, pause the others ---
  useEffect(() => {
    Object.keys(videoRefs.current).forEach((key) => {
      const videoEl = videoRefs.current[key];
      if (videoEl) {
        if (Number(key) === active) {
          // Play the video and catch any browser autoplay policy errors silently
          videoEl.play().catch(() => {}); 
        } else {
          videoEl.pause();
        }
      }
    });
  }, [active]);

  if (!sources.length) return null;

  const hasMultiple = sources.length > 1;
  const prev = () => setActive((i) => (i - 1 + sources.length) % sources.length);
  const next = () => setActive((i) => (i + 1) % sources.length);

  // Helper to detect if a URL is a video
  const isVideo = (url) => url?.match(/\.(mp4|webm|ogg|mov)$/i);

  const lightboxEl = mounted && lightbox ? createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0,0,0,0.96)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={() => setLightbox(false)}
    >
      <button
        onClick={() => setLightbox(false)}
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
          border: "none",
          color: "white",
          fontSize: 24,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100000,
        }}
      >
        ×
      </button>

      {isVideo(sources[active]) ? (
        <video
          key={sources[active]} // Force remount to ensure it auto-plays when changing slides in lightbox
          src={sources[active]}
          controls
          autoPlay
          onClick={(e) => e.stopPropagation()}
          style={{
            maxHeight: "90vh",
            maxWidth: "90vw",
            borderRadius: 16,
            display: "block",
            backgroundColor: "#000",
          }}
        />
      ) : (
        <img
          key={sources[active]}
          src={sources[active]}
          alt="Product fullscreen"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxHeight: "90vh",
            maxWidth: "90vw",
            objectFit: "contain",
            borderRadius: 16,
            display: "block",
          }}
        />
      )}

      {hasMultiple && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            style={{
              position: "fixed",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              border: "none",
              color: "white",
              fontSize: 24,
              cursor: "pointer",
              zIndex: 100000,
            }}
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            style={{
              position: "fixed",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              border: "none",
              color: "white",
              fontSize: 24,
              cursor: "pointer",
              zIndex: 100000,
            }}
          >
            ›
          </button>
        </>
      )}

      {hasMultiple && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255,255,255,0.12)",
            color: "white",
            padding: "4px 14px",
            borderRadius: 99,
            fontSize: 12,
            fontWeight: 700,
            zIndex: 100000,
          }}
        >
          {active + 1} / {sources.length}
        </div>
      )}
    </div>,
    document.body
  ) : null;

  return (
    <>
      {lightboxEl}

      <div className={`flex gap-4 h-full w-full ${className}`}>
        {hasMultiple && (
          <div className="flex flex-col gap-2 w-[68px] flex-shrink-0 overflow-y-auto no-scrollbar">
            {sources.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className={`relative aspect-square w-full flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                  active === i
                    ? "border-[var(--accent)] opacity-100"
                    : "border-[var(--border)] opacity-50 hover:opacity-80"
                }`}
              >
                {isVideo(src) ? (
                  <>
                    <video src={src} className="h-full w-full object-cover pointer-events-none" muted />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <span className="text-white text-[10px] drop-shadow-md">▶</span>
                    </div>
                  </>
                ) : (
                  <img src={src} alt={`View ${i + 1}`} className="h-full w-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="relative flex-1 flex items-center justify-center min-h-0 min-w-0 bg-black rounded-2xl overflow-hidden">
          {sources.map((src, i) => (
            <div
              key={i}
              className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
              style={{
                opacity: active === i ? 1 : 0,
                pointerEvents: active === i ? "auto" : "none",
              }}
            >
              {isVideo(src) ? (
                <video
                  ref={(el) => (videoRefs.current[i] = el)} // <-- NEW: Attach to our Ref tracker
                  src={src}
                  className="h-full w-full object-contain cursor-zoom-in"
                  onClick={() => setLightbox(true)}
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={src}
                  alt={`Product image ${i + 1}`}
                  className="h-full w-full object-contain cursor-zoom-in"
                  onClick={() => setLightbox(true)}
                />
              )}
            </div>
          ))}

          {Array.isArray(colorIndicators) && colorIndicators.length > 0 && (
            <div className="absolute right-3 top-3 flex gap-1.5 z-10">
              {colorIndicators.map((color, i) => (
                <span
                  key={i}
                  className="h-3 w-3 rounded-full border border-white/30 shadow"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}

          <div className="absolute top-3 left-3 bg-black/30 text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full backdrop-blur-sm pointer-events-none z-10">
            Tap to zoom
          </div>

          {hasMultiple && (
            <>
              <button type="button" onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-lg hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors shadow">
                ‹
              </button>
              <button type="button" onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-lg hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors shadow">
                ›
              </button>
            </>
          )}

          {hasMultiple && (
            <div className="absolute bottom-3 left-0 right-0 flex flex-col items-center gap-1.5 pointer-events-none z-10">
              <div className="flex gap-1.5">
                {sources.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: active === i ? 18 : 6,
                      height: 6,
                      background: active === i ? "var(--accent)" : "var(--border)",
                      opacity: active === i ? 1 : 0.5,
                    }}
                  />
                ))}
              </div>
              <span className="rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                {active + 1} / {sources.length}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}