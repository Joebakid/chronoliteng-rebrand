"use client";

import { useState } from "react";
import { updateProduct } from "@/lib/api";
import PageLoader from "@/components/PageLoader";

const fmt = (n) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

export default function InTransitTab({ products = [], fetching, onRefresh }) {
  const [arriving, setArriving] = useState(null); // id of product being marked arrived

  const inTransitProducts = products.filter((p) => p.inTransit);

  const handleMarkArrived = async (product) => {
    setArriving(product.id);
    try {
      // Clear inTransit flag → product moves back to normal inventory
      await updateProduct(product.id, {
        ...product,
        inTransit: false,
        transitNote: "",
        inStock: true,
      });
      onRefresh();
    } catch (err) {
      console.error("[InTransitTab] mark arrived error:", err);
    } finally {
      setArriving(null);
    }
  };

  if (fetching) return <PageLoader text="Loading inventory..." />;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          In Transit ({inTransitProducts.length})
        </h2>
        {inTransitProducts.length > 0 && (
          <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 border border-sky-500/20 animate-pulse">
            Awaiting Arrival
          </span>
        )}
      </div>

      {inTransitProducts.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-[var(--border)] py-20 text-center space-y-2">
          <p className="text-2xl">📦</p>
          <p className="text-sm text-[var(--muted)]">No products currently in transit.</p>
          <p className="text-[11px] text-[var(--muted)] opacity-60">
            Mark a product as "In Transit" in the Products tab to track it here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {inTransitProducts.map((p) => {
            const margin =
              p.costPrice && p.price
                ? (((p.price - p.costPrice) / p.costPrice) * 100).toFixed(1)
                : null;
            const isProfit = margin !== null && parseFloat(margin) >= 0;
            const isArriving = arriving === p.id;

            return (
              <div
                key={p.id}
                className="rounded-[2rem] border border-sky-500/20 bg-[var(--surface-strong)] p-5 shadow-sm space-y-4 relative overflow-hidden"
              >
                {/* Top glow */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-sky-400/60 to-transparent" />

                {/* Product info */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={p.images?.[0]}
                      className="w-16 h-16 rounded-2xl object-cover bg-white border border-[var(--border)]"
                      alt={p.name}
                    />
                    <span className="absolute -top-1 -right-1 text-base">🚚</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{p.name}</p>
                    <p className="text-[10px] uppercase font-bold text-[var(--muted)] tracking-wider">
                      {p.collection || "No Brand"}
                    </p>
                    <p className="text-sm font-semibold text-[var(--accent)] mt-0.5">
                      {fmt(p.price)}
                    </p>
                  </div>
                </div>

                {/* Cost + Margin */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] py-2.5 px-3">
                    <p className="text-[9px] uppercase tracking-widest font-bold text-[var(--muted)] mb-1">Cost Price</p>
                    <p className="text-sm font-bold">{p.costPrice ? fmt(p.costPrice) : "—"}</p>
                  </div>
                  <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] py-2.5 px-3">
                    <p className="text-[9px] uppercase tracking-widest font-bold text-[var(--muted)] mb-1">Margin</p>
                    {margin !== null ? (
                      <p className={`text-sm font-black ${isProfit ? "text-emerald-500" : "text-red-500"}`}>
                        {isProfit ? "+" : ""}{margin}%
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-[var(--muted)]">—</p>
                    )}
                  </div>
                </div>

                {/* Transit note */}
                <div className="rounded-xl bg-sky-500/5 border border-sky-500/15 px-3 py-2 flex items-center gap-2">
                  <span className="text-xs">📍</span>
                  <p className="text-[10px] font-semibold text-sky-600 uppercase tracking-wider">
                    {p.transitNote || "En route — no note added"}
                  </p>
                </div>

                {/* ── Mark as Arrived ── */}
                <button
                  onClick={() => handleMarkArrived(p)}
                  disabled={isArriving}
                  className="w-full rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/8 py-3 text-[11px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-500/15 transition active:scale-95 disabled:opacity-50"
                >
                  {isArriving ? "Updating..." : "✓ Mark as Arrived"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}