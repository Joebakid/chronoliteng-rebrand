"use client";

import { useMemo, memo } from "react";
import SaleCard from "./SaleCard";
import {
  formatCurrency,
  formatMonthName,
  groupSalesByMonth,
  calculateMonthTotals,
} from "./utils";

const ITEMS_PER_PAGE = 5;

/**
 * Sales history with month grouping - optimized with memoization
 */
const SaleHistory = memo(function SaleHistory({
  sales,
  costMap,
  loading,
  page,
  onPageChange,
  onDelete,
}) {
  // Group sales by month - memoized
  const salesByMonth = useMemo(() => groupSalesByMonth(sales), [sales]);

  // Pagination - memoized
  const totalPages = Math.max(1, Math.ceil(salesByMonth.length / ITEMS_PER_PAGE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paginatedMonths = useMemo(
    () => salesByMonth.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE),
    [salesByMonth, safePage]
  );

  // Total revenue - memoized
  const totalRevenue = useMemo(
    () => sales.reduce((s, o) => s + (o.total || 0), 0),
    [sales]
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (sales.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <h2 className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-[var(--muted)]">
          Walk-in History
        </h2>
        <span className="text-[10px] font-bold text-[var(--accent)]">
          {sales.length} sale{sales.length !== 1 ? "s" : ""} · {formatCurrency(totalRevenue)}
        </span>
      </div>

      {/* Month Groups */}
      {paginatedMonths.map(([monthYear, monthSales]) => (
        <MonthGroup
          key={monthYear}
          monthYear={monthYear}
          sales={monthSales}
          costMap={costMap}
          onDelete={onDelete}
        />
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
});

/**
 * Month group - memoized
 */
const MonthGroup = memo(function MonthGroup({ monthYear, sales, costMap, onDelete }) {
  const totals = useMemo(
    () => calculateMonthTotals(sales, costMap),
    [sales, costMap]
  );

  return (
    <div className="space-y-3">
      {/* Month Header */}
      <div className="flex items-center justify-between px-2 py-2 rounded-xl bg-[var(--surface)]/50">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
          {formatMonthName(monthYear)}
        </h3>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-[var(--muted)]">
            {sales.length} sale{sales.length !== 1 ? "s" : ""}
          </span>
          <span className="font-bold text-emerald-600">
            Profit: {formatCurrency(totals.profit)}
          </span>
        </div>
      </div>

      {/* Sales */}
      {sales.map((sale) => (
        <SaleCard
          key={sale.id}
          sale={sale}
          costMap={costMap}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
});

/**
 * Pagination - memoized
 */
const Pagination = memo(function Pagination({ currentPage, totalPages, onPageChange }) {
  return (
    <div className="flex items-center justify-center gap-2 pt-2 pb-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface)] transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Prev
      </button>

      <div className="flex gap-1">
        {Array.from({ length: totalPages }, (_, i) => {
          const p = i + 1;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[40px] text-center rounded-xl px-3 py-2 text-sm border transition ${
                p === currentPage
                  ? "bg-[var(--foreground)] text-[var(--surface-strong)] border-[var(--foreground)]"
                  : "border-[var(--border)] hover:bg-[var(--surface)]"
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface)] transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
});

/**
 * Loading skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 space-y-3 animate-pulse"
        >
          <div className="h-4 w-24 rounded-lg bg-[var(--border)]" />
          <div className="h-4 w-full rounded-lg bg-[var(--border)]" />
          <div className="h-4 w-1/2 rounded-lg bg-[var(--border)]" />
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state
 */
function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] py-20 text-center space-y-2">
      <p className="text-2xl">🏪</p>
      <p className="text-sm text-[var(--muted)]">No walk-in sales yet.</p>
      <p className="text-[11px] text-[var(--muted)] opacity-60">
        Record your first physical sale using the form.
      </p>
    </div>
  );
}

export default SaleHistory;
