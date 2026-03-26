"use client";

import { useState, useMemo } from "react";
import { deleteProduct, toggleProductStock, updateProduct } from "@/lib/api";
import ConfirmModal from "@/components/ConfirmModal";

const ITEMS_PER_PAGE = 6;

const fmt = (n) =>
  new Intl.NumberFormat("en-NG", { 
    style: "currency", 
    currency: "NGN", 
    maximumFractionDigits: 0 
  }).format(n);

export default function ProductInventory({ products = [], onEdit, onRefresh }) {
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [confirmModal, setConfirmModal] = useState({ open: false, productId: null, productName: "" });
  const [visibleProfits, setVisibleProfits] = useState({}); // Tracking which product profit is shown

  // 1. Extract Unique Categories
  const categories = useMemo(() => {
    const cats = products.map(p => p.category || "Uncategorized");
    return ["All", ...Array.from(new Set(cats)).sort()];
  }, [products]);

  // 2. Filter Logic (Hide Transit + Filter by Dropdown)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const isAvailable = !p.inTransit;
      const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
      return isAvailable && matchesCat;
    });
  }, [products, selectedCategory]);

  // 3. Compact Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paginated = filteredProducts.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const goTo = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  const toggleProfit = (id) => {
    setVisibleProfits(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDelete = async () => {
    await deleteProduct(confirmModal.productId);
    onRefresh();
    setConfirmModal({ open: false, productId: null, productName: "" });
  };

  return (
    <div className="space-y-5">
      <ConfirmModal
        open={confirmModal.open}
        title="Delete product?"
        message={`"${confirmModal.productName}" will be permanently deleted.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmModal({ open: false, productId: null, productName: "" })}
      />

      {/* --- Header & Filter Row --- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-2">
        <div>
          <h2 className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-[var(--muted)]">Inventory</h2>
          <p className="text-[10px] font-bold text-[var(--accent)]">
            {filteredProducts.length} {selectedCategory === "All" ? "" : selectedCategory} Styles
          </p>
        </div>

        <div className="relative group">
          <select 
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            className="h-9 w-full sm:w-auto min-w-[140px] appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 text-[10px] font-bold uppercase tracking-widest outline-none transition focus:border-[var(--accent)] pr-10 cursor-pointer"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] text-[8px]">▼</div>
        </div>
      </div>

      {/* --- Product List --- */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-[2.5rem] border border-dashed border-[var(--border)] py-20 text-center bg-[var(--surface)]/30">
          <p className="text-sm text-[var(--muted)]">No {selectedCategory} items in stock.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((p) => {
            const hasMargin = p.costPrice && p.price;
            const profit = hasMargin ? p.price - p.costPrice : null;
            const margin = hasMargin ? (((p.price - p.costPrice) / p.costPrice) * 100).toFixed(1) : null;
            const isProfit = margin !== null && parseFloat(margin) >= 0;
            const isVisible = visibleProfits[p.id];

            return (
              <div key={p.id} className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4 shadow-sm transition-all hover:border-[var(--muted)]">
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={p.images?.[0]} 
                    className="w-14 h-14 rounded-2xl object-cover bg-white border border-[var(--border)] shadow-sm" 
                    alt="" 
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-[13px] font-bold tracking-tight">{p.name}</p>
                      <button 
                        onClick={() => toggleProfit(p.id)}
                        className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border transition-colors ${isVisible ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--border)]'}`}
                      >
                        {isVisible ? 'Hide Profit' : 'Show Profit'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[7px] font-black uppercase bg-[var(--surface)] px-1.5 py-0.5 rounded-md border border-[var(--border)] text-[var(--muted)]">
                        {p.category}
                      </span>
                      <p className="text-[9px] uppercase font-bold text-[var(--muted)] truncate">
                        {p.collection || "Unbranded"}
                      </p>
                    </div>
                    <p className="text-[13px] font-black text-[var(--accent)] mt-1">{fmt(p.price)}</p>
                  </div>
                </div>

                {/* --- Revealable Profit Section --- */}
                {isVisible && margin !== null && (
                  <div className={`mb-4 flex items-center justify-between rounded-xl px-3 py-2 border text-[9px] font-black uppercase tracking-wider animate-in fade-in slide-in-from-top-1 duration-200 ${
                    isProfit ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600" : "bg-red-500/5 border-red-500/20 text-red-500"
                  }`}>
                    <span>{isProfit ? "▲ Profit Analysis" : "▼ Loss Analysis"}</span>
                    <span>{isProfit ? "+" : ""}{fmt(profit)} ({isProfit ? "+" : ""}{margin}%)</span>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-2">
                  <button 
                    onClick={() => toggleProductStock(p.id, !p.inStock).then(onRefresh)}
                    className="rounded-xl bg-[var(--surface)] border border-[var(--border)] py-2.5 text-[9px] font-bold uppercase transition hover:bg-[var(--foreground)] hover:text-[var(--background)]"
                  >
                    {p.inStock ? "Hide" : "Show"}
                  </button>
                  <button 
                    onClick={() => onEdit(p)} 
                    className="rounded-xl bg-[var(--surface)] border border-[var(--border)] py-2.5 text-[9px] font-bold uppercase hover:border-[var(--accent)] transition"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => updateProduct(p.id, { ...p, inTransit: true }).then(onRefresh)}
                    className="rounded-xl bg-sky-500/10 border border-sky-500/20 py-2.5 text-[9px] text-sky-600 hover:bg-sky-500 transition"
                  >
                    🚚
                  </button>
                  <button 
                    onClick={() => setConfirmModal({ open: true, productId: p.id, productName: p.name })} 
                    className="rounded-xl bg-red-500/5 border border-red-500/10 py-2.5 text-[9px] font-bold uppercase text-red-500 hover:bg-red-500 hover:text-white transition"
                  >
                    Del
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- Compact Pagination --- */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 pt-6 pb-2">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--muted)]">
            Page {safePage} <span className="opacity-30">/</span> {totalPages}
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => goTo(safePage - 1)}
              disabled={safePage <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm transition disabled:opacity-20"
            >
              ‹
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => {
                const p = i + 1;
                const isNear = Math.abs(p - safePage) <= 1;
                const isEnd = p === 1 || p === totalPages;
                if (!isNear && !isEnd) return null;

                return (
                  <button
                    key={p}
                    onClick={() => goTo(p)}
                    className={`h-8 min-w-[32px] rounded-lg border px-2 text-[10px] font-bold transition ${
                      p === safePage
                        ? "bg-[var(--foreground)] text-[var(--surface-strong)] border-[var(--foreground)]"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => goTo(safePage + 1)}
              disabled={safePage >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm transition disabled:opacity-20"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}