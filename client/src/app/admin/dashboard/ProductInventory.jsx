"use client";

import { useState, useMemo } from "react";
import { deleteProduct, toggleProductStock, updateProduct } from "@/lib/api";
import ConfirmModal from "@/components/ConfirmModal";

const ITEMS_PER_PAGE = 6;

const fmt = (n) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

// Helper to normalize strings (e.g., "caSio" -> "Casio")
const normalizeBrand = (str) => {
  if (!str) return "";
  const trimmed = str.trim().toLowerCase();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

export default function ProductInventory({ products = [], onEdit, onRefresh }) {
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [search, setSearch] = useState("");
  const [confirmModal, setConfirmModal] = useState({ open: false, productId: null, productName: "" });
  const [visibleProfits, setVisibleProfits] = useState({});

  // Unique categories
  const categories = useMemo(() => {
    const cats = products.map((p) => p.category || "Uncategorized");
    return ["All", ...Array.from(new Set(cats)).sort()];
  }, [products]);

  // Unique brands — Normalized to prevent duplicates like "Casio" vs "casio"
  const brands = useMemo(() => {
    const source =
      selectedCategory === "All"
        ? products
        : products.filter((p) => p.category === selectedCategory);
    
    const normalizedList = source
      .map((p) => normalizeBrand(p.collection))
      .filter(Boolean);
      
    return ["All", ...Array.from(new Set(normalizedList)).sort()];
  }, [products, selectedCategory]);

  // Reset brand when category changes
  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setSelectedBrand("All");
    setPage(1);
  };

  // Filter logic
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (p.inTransit) return false;
      
      // Category Filter
      if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
      
      // Case-Insensitive Brand Filter
      if (selectedBrand !== "All") {
        if (normalizeBrand(p.collection) !== selectedBrand) return false;
      }

      // Search Filter
      if (q) {
        const haystack = `${p.name} ${p.collection} ${p.category} ${p.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [products, selectedCategory, selectedBrand, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paginated = filteredProducts.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );
  
  const goTo = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  const toggleProfit = (id) =>
    setVisibleProfits((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleDelete = async () => {
    await deleteProduct(confirmModal.productId);
    onRefresh();
    setConfirmModal({ open: false, productId: null, productName: "" });
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setSelectedBrand("All");
    setPage(1);
  };

  const hasActiveFilters =
    search || selectedCategory !== "All" || selectedBrand !== "All";

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

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-[var(--muted)]">
            Inventory
          </h2>
          <p className="text-[10px] font-bold text-[var(--accent)]">
            {filteredProducts.length} {selectedCategory === "All" ? "" : selectedCategory} style
            {filteredProducts.length !== 1 ? "s" : ""}
          </p>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-[9px] font-bold uppercase tracking-widest text-red-400 border border-red-500/20 bg-red-500/5 px-3 py-1.5 rounded-xl hover:bg-red-500/10 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm pointer-events-none">
          ⌕
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, brand, category..."
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] pl-9 pr-4 py-2.5 text-[11px] font-medium text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--accent)]"
        />
        {search && (
          <button
            onClick={() => { setSearch(""); setPage(1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* ── Category + Brand filters ── */}
      <div className="flex gap-2">
        {/* Category */}
        <div className="relative flex-1">
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="h-9 w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 pr-7 text-[10px] font-bold uppercase tracking-widest outline-none transition focus:border-[var(--accent)] cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] text-[8px]">▼</div>
        </div>

        {/* Brand */}
        <div className="relative flex-1">
          <select
            value={selectedBrand}
            onChange={(e) => { setSelectedBrand(e.target.value); setPage(1); }}
            className="h-9 w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 pr-7 text-[10px] font-bold uppercase tracking-widest outline-none transition focus:border-[var(--accent)] cursor-pointer"
          >
            {brands.map((b) => (
              <option key={b} value={b}>{b === "All" ? "All Brands" : b}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] text-[8px]">▼</div>
        </div>
      </div>

      {/* Active filter pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5 px-1">
          {search && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-2.5 py-1 text-[9px] font-bold text-[var(--accent)]">
              "{search}"
              <button onClick={() => { setSearch(""); setPage(1); }} className="opacity-60 hover:opacity-100">×</button>
            </span>
          )}
          {selectedCategory !== "All" && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1 text-[9px] font-bold text-[var(--muted)]">
              {selectedCategory}
              <button onClick={() => handleCategoryChange("All")} className="opacity-60 hover:opacity-100">×</button>
            </span>
          )}
          {selectedBrand !== "All" && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1 text-[9px] font-bold text-[var(--muted)]">
              {selectedBrand}
              <button onClick={() => { setSelectedBrand("All"); setPage(1); }} className="opacity-60 hover:opacity-100">×</button>
            </span>
          )}
        </div>
      )}

      {/* ── Product List ── */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-[2.5rem] border border-dashed border-[var(--border)] py-16 text-center bg-[var(--surface)]/30">
          <p className="text-sm text-[var(--muted)]">
            {hasActiveFilters ? "No products match your filters." : "No items in stock."}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="mt-3 text-[10px] font-bold text-[var(--accent)] underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((p) => {
            const hasMargin = p.costPrice && p.price;
            const profit = hasMargin ? p.price - p.costPrice : null;
            const margin = hasMargin
              ? (((p.price - p.costPrice) / p.costPrice) * 100).toFixed(1)
              : null;
            const isProfit = margin !== null && parseFloat(margin) >= 0;
            const isVisible = visibleProfits[p.id];

            return (
              <div
                key={p.id}
                className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4 shadow-sm transition-all hover:border-[var(--muted)]"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={p.images?.[0]}
                    className="w-14 h-14 rounded-2xl object-cover bg-white border border-[var(--border)] shadow-sm flex-shrink-0"
                    alt=""
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[13px] font-bold tracking-tight">{p.name}</p>
                      {hasMargin && (
                        <button
                          onClick={() => toggleProfit(p.id)}
                          className={`flex-shrink-0 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border transition-colors ${
                            isVisible
                              ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                              : "bg-[var(--surface)] text-[var(--muted)] border-[var(--border)]"
                          }`}
                        >
                          {isVisible ? "Hide" : "Profit"}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[7px] font-black uppercase bg-[var(--surface)] px-1.5 py-0.5 rounded-md border border-[var(--border)] text-[var(--muted)]">
                        {p.category}
                      </span>
                      <p className="text-[9px] uppercase font-bold text-[var(--muted)] truncate">
                        {p.collection || "Unbranded"}
                      </p>
                    </div>
                    <p className="text-[13px] font-black text-[var(--accent)] mt-1">
                      {fmt(p.price)}
                    </p>
                  </div>
                </div>

                {/* Profit reveal */}
                {isVisible && margin !== null && (
                  <div
                    className={`mb-4 flex items-center justify-between rounded-xl px-3 py-2 border text-[9px] font-black uppercase tracking-wider animate-in fade-in slide-in-from-top-1 duration-200 ${
                      isProfit
                        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
                        : "bg-red-500/5 border-red-500/20 text-red-500"
                    }`}
                  >
                    <span>{isProfit ? "▲ Profit" : "▼ Loss"}</span>
                    <span>
                      {isProfit ? "+" : ""}{fmt(profit)} ({isProfit ? "+" : ""}{margin}%)
                    </span>
                  </div>
                )}

                {/* Action buttons */}
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
                    className="rounded-xl bg-sky-500/10 border border-sky-500/20 py-2.5 text-[9px] text-sky-600 hover:bg-sky-500 hover:text-white transition"
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

      {/* ── Pagination ── */}
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
                const pg = i + 1;
                const isNear = Math.abs(pg - safePage) <= 1;
                const isEnd = pg === 1 || pg === totalPages;
                if (!isNear && !isEnd) return null;
                return (
                  <button
                    key={pg}
                    onClick={() => goTo(pg)}
                    className={`h-8 min-w-[32px] rounded-lg border px-2 text-[10px] font-bold transition ${
                      pg === safePage
                        ? "bg-[var(--foreground)] text-[var(--surface-strong)] border-[var(--foreground)]"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"
                    }`}
                  >
                    {pg}
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