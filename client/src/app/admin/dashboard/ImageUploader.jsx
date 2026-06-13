"use client";

import { useState, useRef, useEffect } from "react";

export default function ImageUploader({
  existingImages = [],
  imagePreviews = [],
  newFiles = [], // <-- Added this back so we can check file types
  onAddFiles,
  onRemoveExisting,
  onRemoveNew,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState(null); // Will now store the active media object instead of just a string
  const inputRef = useRef(null);

  // 1. Combine images into one array and determine if they are videos/unsupported
  const allImages = [
    ...existingImages.map((url) => {
      const isVideo = !!url.match(/\.(mp4|webm|ogg)$/i);
      return { url, type: "existing", isVideo, isUnsupported: false };
    }),
    ...imagePreviews.map((url, index) => {
      const file = newFiles[index];
      const fileName = file?.name || "";
      const ext = fileName.split('.').pop().toLowerCase();
      
      const isUnsupported = ['mov', 'avi', 'wmv', 'mkv', 'flv'].includes(ext);
      const isVideo = file?.type?.startsWith("video/") || isUnsupported || ext === 'mp4';
      
      return { url, type: "new", isVideo, isUnsupported, ext };
    }),
  ];

  const activeItem = allImages[activeIndex] ?? null;

  // 2. CRITICAL FIX: Ensure activeIndex doesn't go out of bounds 
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
      {/* --- LIGHTBOX FOR MAIN PREVIEW --- */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
          onClick={() => setLightbox(null)}
        >
          {lightbox.isVideo ? (
             lightbox.isUnsupported ? (
               <div className="flex flex-col items-center justify-center bg-zinc-900 rounded-2xl p-8 max-w-md text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
                 <span className="text-3xl text-red-500 font-black mb-2 uppercase">Cannot Play .{lightbox.ext}</span>
                 <p className="text-zinc-400 text-sm">This video format cannot be previewed in the browser. It will be automatically converted to MP4 when you save the product.</p>
               </div>
             ) : (
               <video src={lightbox.url} controls autoPlay className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
             )
          ) : (
             <img src={lightbox.url} className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" alt="" onClick={(e) => e.stopPropagation()} />
          )}
          <button className="absolute top-6 right-6 text-white text-3xl hover:text-[var(--accent)] transition-colors">×</button>
        </div>
      )}

      <div className="space-y-2">
        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--muted)] ml-0.5">
          Images & Videos
        </span>

        <div className="flex gap-3">
          {/* --- THUMBNAIL STRIP --- */}
          <div className="flex flex-col gap-2 w-[72px] max-h-[400px] flex-shrink-0 overflow-y-auto no-scrollbar pb-2">
            {allImages.map((img, i) => (
              <div
                key={`${img.type}-${i}-${img.url.slice(-10)}`} 
                onClick={() => setActiveIndex(i)}
                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
                  activeIndex === i
                    ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/20 opacity-100 scale-105 z-10 bg-[var(--surface)]"
                    : "border-[var(--border)] opacity-60 hover:opacity-100 bg-[var(--surface-strong)]"
                }`}
              >
                {/* Thumbnail Render Logic */}
                {img.isVideo ? (
                   img.isUnsupported ? (
                     <div className="h-full w-full flex items-center justify-center bg-zinc-900 text-center p-1">
                        <span className="text-[9px] font-black text-red-500 tracking-tighter uppercase">MOV<br/>ERR</span>
                     </div>
                   ) : (
                     <video src={img.url} className="h-full w-full object-cover" muted playsInline />
                   )
                ) : (
                   <img src={img.url} className="h-full w-full object-cover" alt="" />
                )}

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(i); }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-[12px] flex items-center justify-center hover:bg-red-500 transition-colors z-20"
                >
                  ×
                </button>
                {img.type === "new" && (
                  <div className="absolute bottom-0 left-0 right-0 bg-[var(--accent)]/90 text-[7px] font-black text-black text-center py-0.5 uppercase tracking-wider z-20">
                    New
                  </div>
                )}
              </div>
            ))}

            {/* Add button thumbnail */}
            <div
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all flex-shrink-0"
            >
              <span className="text-[var(--muted)] text-xl leading-none">+</span>
            </div>
          </div>

          {/* --- MAIN PREVIEW AREA --- */}
          <div className="flex-1 min-h-[320px] rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]/40 overflow-hidden relative group">
            {activeItem ? (
              <>
                {activeItem.isVideo ? (
                  activeItem.isUnsupported ? (
                    <div 
                      className="h-full w-full flex flex-col items-center justify-center bg-black/50 p-6 text-center cursor-pointer transition-colors hover:bg-black/40"
                      style={{ minHeight: 320 }}
                      onClick={() => setLightbox(activeItem)}
                    >
                      <span className="text-xl font-black text-red-500 mb-2 uppercase tracking-widest">Cannot Play .{activeItem.ext}</span>
                      <p className="text-xs text-[var(--muted)] max-w-[200px] leading-relaxed">Format unplayable in browser. It will be converted to MP4 automatically upon saving.</p>
                    </div>
                  ) : (
                    <video
                      src={activeItem.url}
                      className="h-full w-full object-contain cursor-zoom-in transition-transform duration-500 group-hover:scale-[1.02]"
                      style={{ minHeight: 320, backgroundColor: "#000" }}
                      autoPlay
                      muted
                      loop
                      playsInline
                      onClick={() => setLightbox(activeItem)}
                    />
                  )
                ) : (
                  <img
                    src={activeItem.url}
                    className="h-full w-full object-contain cursor-zoom-in transition-transform duration-500 group-hover:scale-[1.02]"
                    style={{ minHeight: 320 }}
                    onClick={() => setLightbox(activeItem)}
                    alt=""
                    onError={(e) => {
                      e.target.src = "https://placehold.co/600x600/1a1a1a/666666?text=Preview+Unavailable";
                    }}
                  />
                )}

                <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 z-10 pointer-events-none">
                  {activeIndex + 1} / {allImages.length}
                </div>
                <div className="absolute top-3 right-3 bg-black/50 text-white text-[9px] px-2.5 py-1 rounded-full backdrop-blur-sm uppercase tracking-widest font-bold border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  Tap to expand
                </div>
              </>
            ) : (
              <div
                className="h-full flex flex-col items-center justify-center gap-3 cursor-pointer"
                style={{ minHeight: 320 }}
                onClick={() => inputRef.current?.click()}
              >
                <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-[var(--border)] flex items-center justify-center text-3xl text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
                  +
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">Add Media</p>
                  <p className="text-[9px] text-[var(--muted)] opacity-60 mt-1">PNG, JPG, MP4, MOV</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- HIDDEN FILE INPUT (Updated to accept videos) --- */}
        <input 
          ref={inputRef} 
          type="file" 
          multiple 
          accept="image/*,video/*,.gif,.mov,.mp4,.avi,.mkv" 
          onChange={handleFiles} 
          className="hidden" 
        />

        {allImages.length > 0 && (
          <p className="text-[9px] text-[var(--muted)] text-center font-medium mt-2">
            {allImages.length} media item{allImages.length !== 1 ? "s" : ""} · Drag to reorder (Coming Soon) · First item is main
          </p>
        )}
      </div>
    </>
  );
}