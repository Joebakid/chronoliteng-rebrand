"use client";

import { useState } from "react";
import { resolveProductImage } from "@/lib/productImage";
import OrderDetailModal from "./OrderDetailModal";
import InstallmentTracker from "@/components/profile/InstallmentTracker";

const PURCHASES_PER_PAGE = 3;

function resolveOrderImage(item) {
  return item.selectedVariantImage || resolveProductImage(item);
}

function formatPrice(amount) {
  return new Intl.NumberFormat("en-NG", { 
    style: "currency", 
    currency: "NGN", 
    maximumFractionDigits: 0 
  }).format(amount || 0);
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(value));
}

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

export default function PurchaseHistory({ purchases = [], loading, onLightbox, onRefresh }) {
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // 1. Active Installments (Unfinished)
  const activeInstallments = purchases.filter(
    (p) => p.paymentType === "installment" && p.paymentStatus !== "fully_paid" && (p.balanceDue || 0) > 0
  );

  // 2. Finished Orders for Purchase History (Full payments OR 100% completed installments)
  const finishedPurchases = purchases.filter(
    (p) => p.paymentType !== "installment" || p.paymentStatus === "fully_paid" || (p.balanceDue || 0) <= 0
  );

  const totalPages = Math.ceil(finishedPurchases.length / PURCHASES_PER_PAGE);
  const paginated = finishedPurchases.slice((page - 1) * PURCHASES_PER_PAGE, page * PURCHASES_PER_PAGE);

  return (
    <>
      <section className="flex-1 flex flex-col rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] shadow-[var(--shadow)] overflow-hidden min-h-[340px] space-y-4">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-strong)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Recent Activity</p>
              <h2 className="mt-0.5 text-base font-bold text-[var(--foreground)]">Purchase History</h2>
            </div>
            {loading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--muted)] border-t-transparent" />
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 sm:p-5 space-y-6">
          
          {/* Active Payment Plan Tracker (Only visible if active installments exist) */}
          {activeInstallments.length > 0 && (
            <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface)]/80 p-1 sm:p-2 backdrop-blur-sm">
              <InstallmentTracker orders={purchases} onPaymentSuccess={onRefresh} />
            </div>
          )}

          {/* Finished Purchase History List */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] px-1">
              Completed Purchases ({finishedPurchases.length})
            </p>

            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : finishedPurchases.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-xs text-[var(--muted)] italic">No completed purchases yet.</p>
              </div>
            ) : (
              paginated.map((purchase) => {
                const totalAmt = purchase.totalAmount || purchase.total || 0;

                return (
                  <div 
                    key={purchase.id} 
                    onClick={() => setSelectedOrder(purchase)}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 transition-all hover:border-[var(--accent)] hover:shadow-md cursor-pointer group active:scale-[0.99]"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[0.75rem] font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                          Order #{purchase.id.slice(-6).toUpperCase()}
                        </p>

                        {purchase.paymentType === "installment" && (
                          <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Completed Plan
                          </span>
                        )}
                      </div>

                      <p className="text-[0.65rem] text-[var(--muted)] font-medium">
                        {formatDate(purchase.createdAt)} • <span className="italic opacity-70">View details</span>
                      </p>
                    </div>
                    
                    {/* Item Thumbnails */}
                    <div className="flex -space-x-2 shrink-0">
                      {purchase.items?.slice(0, 3).map((item, i) => {
                        const itemImg = resolveOrderImage(item);
                        return (
                          <div
                            key={i}
                            className="h-8 w-8 rounded-full border-2 border-[var(--surface)] bg-white overflow-hidden shadow-sm shrink-0"
                          >
                            <img 
                              src={itemImg} 
                              alt={item.name} 
                              className="h-full w-full object-contain p-0.5" 
                              onError={(e) => { e.target.src = "https://placehold.co/100x100/png?text=Watch"; }}
                            />
                          </div>
                        );
                      })}
                      {purchase.items?.length > 3 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--surface)] bg-[var(--surface-strong)] text-[0.6rem] font-bold text-[var(--muted)] shadow-sm shrink-0">
                          +{purchase.items.length - 3}
                        </div>
                      )}
                    </div>

                    {/* Total Price */}
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-[var(--foreground)]">{formatPrice(totalAmt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className="mt-auto border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 flex items-center justify-between">
            <button 
              onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(1, p - 1)); }} 
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
              onClick={(e) => { e.stopPropagation(); setPage(p => Math.min(totalPages, p + 1)); }} 
              disabled={page === totalPages}
              className="flex h-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-3 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--foreground)] transition hover:bg-[var(--border)] disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </section>

      {/* Order Detail Modal View */}
      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </>
  );
}