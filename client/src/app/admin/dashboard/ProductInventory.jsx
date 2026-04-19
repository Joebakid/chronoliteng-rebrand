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

const normalizeBrand = (str) => {
  if (!str) return "";
  const trimmed = str.trim().toLowerCase();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const normalizeCategory = (str) => {
  if (!str) return "Uncategorized";
  const trimmed = str.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

export default function ProductInventory({ products = [], onEdit, onRefresh }) {
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [search, setSearch] = useState("");
  const [confirmModal, setConfirmModal] = useState({ open: false, productId: null, productName: "" });
  const [visibleProfits, setVisibleProfits] = useState({});

  const categories = useMemo(() => {
    const cats = products.map((p) => normalizeCategory(p.category));
    return ["All", ...Array.from(new Set(cats)).sort()];
  }, [products]);

  const brands = useMemo(() => {
    const source = selectedCategory === "All"
      ? products
      : products.filter((p) => normalizeCategory(p.category) === selectedCategory);
    return ["All", ...Array.from(new Set(source.map((p) => normalizeBrand(p.collection)).filter(Boolean))).sort()];
  }, [products, selectedCategory]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (p.inTransit) return false;
      if (selectedCategory !== "All" && normalizeCategory(p.category) !== selectedCategory) return false;
      if (selectedBrand !== "All" && normalizeBrand(p.collection) !== selectedBrand) return false;
      if (q && !`${p.name} ${p.collection} ${p.category} ${p.description}`.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [products, selectedCategory, selectedBrand, search]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginated = filteredProducts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    // Remove if you don't want any scroll behavior
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-5">
      <ConfirmModal
        open={confirmModal.open}
        title="Delete product?"
        message={`"${confirmModal.productName}" will be permanently deleted.`}
        confirmLabel="Delete"
        danger
        onConfirm={async () => { await deleteProduct(confirmModal.productId); onRefresh(); setConfirmModal({ open: false, productId: null, productName: "" }); }}
        onCancel={() => setConfirmModal({ open: false, productId: null, productName: "" })}
      />

      <div className="flex items-center justify-between px-1">
        <h2 className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-[var(--muted)]">Inventory</h2>
      </div>

      <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search..." className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2.5 text-[11px]" />
      
      <div className="flex gap-2">
        <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }} className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 text-[10px] font-bold uppercase">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <select value={selectedBrand} onChange={(e) => { setSelectedBrand(e.target.value); setPage(1); }} className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 text-[10px] font-bold uppercase">{brands.map(b => <option key={b} value={b}>{b}</option>)}</select>
      </div>

      <div className="space-y-3">
        {paginated.map((p) => {
          const hasMargin = p.costPrice && p.price;
          const isVisible = visibleProfits[p.id];
          return (
            <div key={p.id} className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <img src={p.images?.[0]} className="w-14 h-14 rounded-2xl object-cover bg-white" alt="" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-start">
                    <p className="truncate text-[13px] font-bold">{p.name}</p>
                    {hasMargin && <button onClick={() => setVisibleProfits(prev => ({...prev, [p.id]: !prev[p.id]}))} className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${isVisible ? "bg-[var(--accent)] text-white" : "bg-[var(--surface)] text-[var(--muted)]"}`}>{isVisible ? "Hide" : "Profit"}</button>}
                  </div>
                  <p className="text-[13px] font-black text-[var(--accent)]">{fmt(p.price)}</p>
                </div>
              </div>
              {isVisible && hasMargin && <div className="mt-3 p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-[9px] font-black text-emerald-600 uppercase">Profit: {fmt(p.price - p.costPrice)}</div>}
              <div className="grid grid-cols-4 gap-2 mt-4">
                <button onClick={() => toggleProductStock(p.id, !p.inStock).then(onRefresh)} className="rounded-xl bg-[var(--surface)] py-2 text-[9px] font-bold uppercase">{p.inStock ? "Hide" : "Show"}</button>
                <button onClick={() => onEdit(p)} className="rounded-xl bg-[var(--surface)] py-2 text-[9px] font-bold uppercase">Edit</button>
                <button onClick={() => updateProduct(p.id, { ...p, inTransit: true }).then(onRefresh)} className="rounded-xl bg-sky-500/10 py-2 text-[9px]">🚚</button>
                <button onClick={() => setConfirmModal({ open: true, productId: p.id, productName: p.name })} className="rounded-xl bg-red-500/5 py-2 text-[9px] font-bold text-red-500">Del</button>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 mt-10 pb-10">
          <div className="flex items-center gap-2">
            <button onClick={() => handlePageChange(page - 1)} disabled={page <= 1} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] hover:bg-[var(--surface)] disabled:opacity-20 transition">‹</button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => handlePageChange(p)} className={`flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2 text-[11px] font-black transition border ${p === page ? "bg-[var(--foreground)] text-[var(--surface-strong)] border-[var(--foreground)]" : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted)]"}`}>{p}</button>
              ))}
            </div>
            <button onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] hover:bg-[var(--surface)] disabled:opacity-20 transition">›</button>
          </div>
        </div>
      )}
    </div>
  );
}