"use client";
import { useState, useRef, useEffect } from "react";

export default function ImageWithLoader({ src, alt, className = "" }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  // If the image is already cached, onLoad might not fire. 
  // This check ensures we handle that.
  useEffect(() => {
    if (imgRef.current?.complete) {
      setLoading(false);
    }
  }, [src]);

  return (
    <div className={`relative bg-[var(--card-media)] overflow-hidden ${className}`}>
      
      {/* Skeleton Shimmer */}
      {loading && (
        <div className="absolute inset-0 z-10">
          <div className="h-full w-full animate-pulse bg-[var(--border)]" />
          {/* Subtle Shimmer Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite]" 
               style={{ backgroundSize: '200% 100%' }} />
        </div>
      )}

      {/* The Image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        className={`h-full w-full object-cover transition-opacity duration-500 ${
          loading ? "opacity-0" : "opacity-100"
        } ${error ? "hidden" : "block"}`}
        loading="lazy"
      />

      {/* Fallback if image fails */}
      {error && (
        <div className="flex h-full w-full items-center justify-center bg-[var(--card-media)] text-[0.6rem] uppercase text-[var(--muted)]">
          Image unavailable
        </div>
      )}
    </div>
  );
}