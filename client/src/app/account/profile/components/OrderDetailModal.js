"use client";

import { resolveProductImage } from "@/lib/productImage";

const labelCls = "text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]";

function formatPrice(amount) {
  return new Intl.NumberFormat("en-NG", { 
    style: "currency", 
    currency: "NGN", 
    maximumFractionDigits: 0 
  }).format(amount);
}

export default function OrderDetailModal({ order, onClose }) {
  if (!order) return null;

  // Use the last 6 characters to match the User Profile view
  const shortId = order.id.slice(-6).toUpperCase();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
      <div 
        className="w-full max-w-xl rounded-[2.5rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-2xl animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-[var(--border)]/50 pb-4 mb-6">
          <div>
            <p className={labelCls}>Order Summary</p>
            <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
              Order <span className="text-[var(--accent)]">#{shortId}</span>
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="h-10 w-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-xl hover:bg-red-500 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* LEFT: ITEMS LIST */}
          <div className="space-y-4">
            <p className={labelCls}>Items Purchased</p>
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 no-scrollbar">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-3 items-center bg-[var(--surface)] p-2.5 rounded-2xl border border-[var(--border)]/50">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white border border-[var(--border)]/50 shadow-sm">
                    <img 
                      src={item.selectedVariantImage || resolveProductImage(item)} 
                      className="h-full w-full object-contain p-1.5" 
                      alt={item.name} 
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate text-[var(--foreground)]">{item.name}</p>
                    <p className="text-[10px] font-medium text-[var(--muted)]">
                      {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: DELIVERY & SUMMARY */}
          <div className="space-y-6">
            <div className="space-y-3">
              <p className={labelCls}>Shipping Details</p>
              <div className="rounded-2xl bg-[var(--surface)] p-4 border border-[var(--border)]/50 text-[11px] leading-relaxed shadow-inner">
                <p className="font-black text-[var(--foreground)] mb-1 uppercase tracking-tight">
                  {order.delivery.name}
                </p>
                <p className="text-[var(--muted)] font-bold">{order.delivery.phone}</p>
                <p className="text-[var(--muted)] mt-1.5 italic">
                  {order.delivery.address}, {order.delivery.city}, {order.delivery.state}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-[var(--border)]/50">
              <div className="flex justify-between text-[11px]">
                <span className="text-[var(--muted)] font-medium">Subtotal</span>
                <span className="font-bold">{formatPrice(order.total - (order.delivery.state === "Delta" ? 2500 : 4000))}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[var(--muted)] font-medium">Delivery</span>
                <span className="font-bold">{formatPrice(order.delivery.state === "Delta" ? 2500 : 4000)}</span>
              </div>
              <div className="flex justify-between font-black text-lg text-[var(--accent)] pt-3 border-t border-dashed border-[var(--border)]/30 mt-2">
                <span className="text-[10px] uppercase tracking-widest text-[var(--foreground)]">Total Paid</span>
                <span className="tracking-tighter">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="mt-8 w-full rounded-full bg-[var(--foreground)] py-4 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[var(--surface-strong)] transition hover:opacity-90 active:scale-[0.97]"
        >
          Close Order View
        </button>
      </div>
    </div>
  );
}