"use client";

import { useState } from "react";
import { resolveProductImage } from "@/lib/productImage";

const PURCHASES_PER_PAGE = 3;

function formatPrice(amount) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}
function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(value));
}

// Separate Skeleton component for a cleaner main component
function SkeletonRow() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 rounded bg-[var(--border)]" />
        <div className="h-2 w-12 rounded bg-[var(--border)] opacity-50" />
      </div>
      <div className="flex -space-x-2">
        <div className="h-8 w-8 rounded-full border-2 border-[var(--surface)] bg-[var(--border)]" />
        <div className="h-8 w-8 rounded-full border-2 border-[var(--surface)] bg-[var(--border)]" />
      </div>
      <div className="h-3 w-16 rounded bg-[var(--border)]" />
    </div>
  );
}

export default function PurchaseHistory({ purchases, loading, onLightbox }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(purchases.length / PURCHASES_PER_PAGE);
  const paginated = purchases.slice((page - 1) * PURCHASES_PER_PAGE, page * PURCHASES_PER_PAGE);

  return (
    <section className="flex-1 flex flex-col rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] shadow-[var(--shadow)] overflow-hidden min-h-[340px]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-strong)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Recent Activity</p>
            <p className="mt-0.5 text-base font-semibold text-[var(--foreground)]">Purchase History</p>
          </div>
          {loading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--muted)] border-t-transparent" />
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 sm:p-5">
        <div className="space-y-2.5">
          {loading ? (
            // Show 3 skeleton rows while loading
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : purchases.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-xs text-[var(--muted)] italic">No history yet.</p>
            </div>
          ) : (
            paginated.map((purchase) => (
              <div key={purchase.id} className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 transition-colors hover:border-[var(--muted)]">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.75rem] font-bold text-[var(--foreground)]">
                    Order #{purchase.id.slice(-6).toUpperCase()}
                  </p>
                  <p className="text-[0.65rem] text-[var(--muted)] font-medium">{formatDate(purchase.createdAt)}</p>
                </div>
                
                {/* Clickable Image Thumbnails */}
                <div className="flex -space-x-2.5">
                  {purchase.items.slice(0, 3).map((item, i) => (
                    <button
                      key={i}
                      onClick={() => onLightbox(resolveProductImage(item))}
                      className="group relative h-8 w-8 rounded-full border-2 border-[var(--surface)] bg-white overflow-hidden shadow-sm transition-transform hover:scale-110 hover:z-10 active:scale-95"
                    >
                      <img src={resolveProductImage(item)} alt={item.name} className="h-full w-full object-contain p-0.5" />
                    </button>
                  ))}
                  {purchase.items.length > 3 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--surface)] bg-[var(--surface-strong)] text-[0.6rem] font-bold text-[var(--muted)] shadow-sm">
                      +{purchase.items.length - 3}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-xs font-bold text-[var(--foreground)]">{formatPrice(purchase.total)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Structured Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div className="mt-auto border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page === 1}
            className="flex h-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-3 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--foreground)] transition hover:bg-[var(--border)] disabled:opacity-30"
          >
            Prev
          </button>

          <div className="flex items-center gap-1.5">
             <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
             <span className="text-[0.7rem] font-medium text-[var(--muted)]">{page} / {totalPages}</span>
          </div>

          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
            disabled={page === totalPages}
            className="flex h-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-3 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--foreground)] transition hover:bg-[var(--border)] disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}