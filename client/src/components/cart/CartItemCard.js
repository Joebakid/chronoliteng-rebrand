"use client";

import { resolveProductImage } from "@/lib/productImage";
import { formatPrice } from "./formatPrice";

export default function CartItemCard({
  item,
  updateCartQuantity,
  removeFromCart,
}) {
  /**
   * 1. PRIORITY CHECK: 
   * We check item.selectedImage first (the variant currently in the cart state).
   * We fallback to resolveProductImage if the state is empty.
   */
  const activeImage = item.selectedImage || resolveProductImage(item);

  return (
    <article className="grid gap-6 rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-[var(--shadow)] sm:grid-cols-[160px_1fr] transition-all duration-300">
      
      {/* LEFT: IMAGE PREVIEW */}
      <div className="relative aspect-square overflow-hidden rounded-[1.5rem] bg-white border border-[var(--border)] group">
        <img
          src={activeImage}
          alt={item.name}
          className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
        />
        {/* Subtle Overlay to indicate variant selection */}
        <div className="absolute inset-0 bg-black/5 pointer-events-none" />
      </div>

      {/* RIGHT: CONTENT */}
      <div className="flex flex-col justify-between gap-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
              {item.collection || "Excellence"}
            </p>
            <h2 className="text-xl font-bold tracking-tight mt-0.5">{item.name}</h2>
          </div>
          <button
            onClick={() => removeFromCart(item.slug)}
            className="text-[10px] font-bold uppercase text-red-500/60 hover:text-red-500 transition-colors"
          >
            Remove Item
          </button>
        </div>

        {/* VARIANT SELECTION GRID */}
        {item.images && item.images.length > 1 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
               <p className="text-[0.6rem] font-black uppercase tracking-widest text-[var(--muted)]">
                Switch Variant:
              </p>
              <span className="h-px flex-1 bg-[var(--border)]/50"></span>
            </div>
            
            <div className="flex flex-wrap gap-2.5">
              {item.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  /** * SUCCESS LOGIC: 
                   * Clicking this updates the global context. 
                   * This image URL will now be the one sent to 'verify-payment'
                   */
                  onClick={() => updateCartQuantity(item.slug, item.quantity, img)}
                  className={`relative h-14 w-14 overflow-hidden rounded-xl border-2 transition-all duration-300 active:scale-90 ${
                    activeImage === img
                      ? "border-[var(--accent)] ring-4 ring-[var(--accent)]/10 z-10 scale-105"
                      : "border-[var(--border)] opacity-30 grayscale hover:opacity-100 hover:grayscale-0"
                  }`}
                >
                  <img src={img} className="h-full w-full object-cover" alt={`variant-${idx}`} />
                  {activeImage === img && (
                    <div className="absolute bottom-0 right-0 bg-[var(--accent)] p-0.5 rounded-tl-lg">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* BOTTOM CONTROLS */}
        <div className="flex justify-between items-center mt-auto pt-4 border-t border-[var(--border)]/50">
          <div className="flex items-center gap-5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2">
            <button 
              className="text-lg font-bold hover:text-[var(--accent)] transition-colors"
              onClick={() => updateCartQuantity(item.slug, item.quantity - 1, activeImage)}
            >
              −
            </button>
            <span className="text-sm font-black w-4 text-center tabular-nums">{item.quantity}</span>
            <button 
              className="text-lg font-bold hover:text-[var(--accent)] transition-colors"
              onClick={() => updateCartQuantity(item.slug, item.quantity + 1, activeImage)}
            >
              +
            </button>
          </div>

          <div className="text-right">
             <p className="text-xl font-black text-[var(--foreground)] tracking-tighter">
              {formatPrice(item.price * item.quantity)}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}