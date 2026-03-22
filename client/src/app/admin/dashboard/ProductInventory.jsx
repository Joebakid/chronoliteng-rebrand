"use client";

import { useState } from "react";
import { deleteProduct, toggleProductStock, updateProduct } from "@/lib/api";
import ConfirmModal from "@/components/ConfirmModal";
import Pagination from "@/components/Pagination";
import { useSearchParams } from "next/navigation";

const ITEMS_PER_PAGE = 6;

const fmt = (n) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

export default function ProductInventory({ products = [], onEdit, onRefresh }) {
  const searchParams = useSearchParams();
  const [confirmModal, setConfirmModal] = useState({ open: false, productId: null, productName: "" });
  const [transitModal, setTransitModal] = useState({ open: false, product: null });
  const [transitNote, setTransitNote] = useState("");
  const [sendingToTransit, setSendingToTransit] = useState(null);

  const handleDelete = async () => {
    await deleteProduct(confirmModal.productId);
    onRefresh();
    setConfirmModal({ open: false, productId: null, productName: "" });
  };

  const openTransitModal = (product) => {
    setTransitNote("");
    setTransitModal({ open: true, product });
  };

  const handleSendToTransit = async () => {
    if (!transitModal.product) return;
    setSendingToTransit(transitModal.product.id);
    try {
      await updateProduct(transitModal.product.id, {
        ...transitModal.product,
        inTransit: true,
        inStock: false,
        transitNote: transitNote.trim() || "",
      });
      setTransitModal({ open: false, product: null });
      setTransitNote("");
      onRefresh();
    } catch (err) {
      console.error("[ProductInventory] send to transit error:", err);
    } finally {
      setSendingToTransit(null);
    }
  };

  // Only show products NOT in transit
  const inventoryProducts = products.filter((p) => !p.inTransit);

  // Pagination
  const currentPage = Number(searchParams.get("invPage")) || 1;
  const totalPages = Math.max(1, Math.ceil(inventoryProducts.length / ITEMS_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginated = inventoryProducts.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-4">
      {/* Delete confirm */}
      <ConfirmModal
        open={confirmModal.open}
        title="Delete product?"
        message={`"${confirmModal.productName}" will be permanently deleted.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmModal({ open: false, productId: null, productName: "" })}
      />

      {/* Send to Transit modal */}
      {transitModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-2xl space-y-5">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.28em] text-sky-500 mb-1">Send to Transit</p>
              <h3 className="text-base font-bold">{transitModal.product?.name}</h3>
              <p className="text-xs text-[var(--muted)] mt-1">
                This will mark the product as ordered but not yet arrived. It will be hidden from your storefront.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] ml-1">
                Transit Note (optional)
              </label>
              <input
                value={transitNote}
                onChange={(e) => setTransitNote(e.target.value)}
                placeholder="e.g. Ordered from supplier, ETA 7 days"
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-sky-500 w-full"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setTransitModal({ open: false, product: null })}
                className="flex-1 rounded-full border border-[var(--border)] py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--foreground)] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSendToTransit}
                disabled={!!sendingToTransit}
                className="flex-1 rounded-full bg-sky-500 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-sky-600 transition disabled:opacity-50"
              >
                {sendingToTransit ? "Sending..." : "🚚 Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <h2 className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-[var(--muted)]">Inventory</h2>
        <span className="text-[10px] font-bold text-[var(--accent)]">{inventoryProducts.length} Styles</span>
      </div>

      {inventoryProducts.length === 0 && (
        <div className="rounded-[2rem] border border-dashed border-[var(--border)] py-16 text-center">
          <p className="text-sm text-[var(--muted)]">No products in inventory.</p>
          <p className="text-[11px] text-[var(--muted)] opacity-60 mt-1">
            Products in transit are tracked in the In Transit tab.
          </p>
        </div>
      )}

      {/* Product cards */}
      {paginated.map((p) => {
        const hasMargin = p.costPrice && p.price;
        const profit = hasMargin ? p.price - p.costPrice : null;
        const margin = hasMargin ? (((p.price - p.costPrice) / p.costPrice) * 100).toFixed(1) : null;
        const isProfit = margin !== null && parseFloat(margin) >= 0;

        return (
          <div key={p.id} className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4 shadow-sm">
            <div className="flex items-center gap-4 mb-3">
              <div className="relative flex-shrink-0">
                <img
                  src={p.images?.[0]}
                  className="w-16 h-16 rounded-2xl object-cover bg-white border border-[var(--border)]"
                  alt={p.name}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{p.name}</p>
                <p className="text-[10px] uppercase font-bold text-[var(--muted)] tracking-wider">
                  {p.collection || "No Brand"}
                </p>
                <p className="text-sm font-medium text-[var(--accent)]">{fmt(p.price)}</p>
              </div>
            </div>

            {margin !== null && (
              <div className={`mb-3 flex items-center justify-between rounded-xl px-3 py-2 border text-[10px] font-black uppercase tracking-wider ${isProfit ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600" : "bg-red-500/5 border-red-500/20 text-red-500"}`}>
                <span>{isProfit ? "▲ Profit" : "▼ Loss"}</span>
                <span>{isProfit ? "+" : ""}{fmt(profit)} ({isProfit ? "+" : ""}{margin}%)</span>
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => toggleProductStock(p.id, !p.inStock).then(onRefresh)}
                className="rounded-xl bg-[var(--surface)] border border-[var(--border)] py-2 text-[10px] font-bold uppercase"
              >
                {p.inStock ? "Hide" : "Show"}
              </button>
              <button
                onClick={() => onEdit(p)}
                className="rounded-xl bg-[var(--surface)] border border-[var(--border)] py-2 text-[10px] font-bold uppercase"
              >
                Edit
              </button>
              <button
                onClick={() => openTransitModal(p)}
                className="rounded-xl bg-sky-500/10 border border-sky-500/20 py-2 text-[10px] font-bold uppercase text-sky-600 hover:bg-sky-500/20 transition"
                title="Move to In Transit"
              >
                🚚
              </button>
              <button
                onClick={() => setConfirmModal({ open: true, productId: p.id, productName: p.name })}
                className="rounded-xl bg-red-50 border border-red-100 py-2 text-[10px] font-bold uppercase text-red-600"
              >
                Del
              </button>
            </div>
          </div>
        );
      })}

      {/* Pagination — uses invPage param to avoid clashing with other paginations */}
      {inventoryProducts.length > 0 && (
        <InventoryPagination totalPages={totalPages} currentPage={safePage} />
      )}
    </div>
  );
}

// Separate client component for inventory pagination
// Uses `invPage` param instead of `page` to avoid conflicts with other tabs
function InventoryPagination({ totalPages, currentPage }) {
  const searchParams = useSearchParams();

  const createURL = (pageNumber) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("invPage", pageNumber.toString());
    return `?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-2 pb-4">
      {currentPage > 1 ? (
        <a href={createURL(currentPage - 1)} className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs hover:bg-[var(--surface)] transition">
          Prev
        </a>
      ) : (
        <span className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs opacity-30 cursor-not-allowed">Prev</span>
      )}

      <div className="flex gap-1">
        {Array.from({ length: totalPages }, (_, i) => {
          const page = i + 1;
          return (
            <a
              key={page}
              href={createURL(page)}
              className={`min-w-[36px] text-center rounded-xl px-3 py-2 text-xs border transition ${
                page === currentPage
                  ? "bg-[var(--foreground)] text-[var(--surface-strong)] border-[var(--foreground)]"
                  : "border-[var(--border)] hover:bg-[var(--surface)]"
              }`}
            >
              {page}
            </a>
          );
        })}
      </div>

      {currentPage < totalPages ? (
        <a href={createURL(currentPage + 1)} className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs hover:bg-[var(--surface)] transition">
          Next
        </a>
      ) : (
        <span className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs opacity-30 cursor-not-allowed">Next</span>
      )}
    </div>
  );
}