"use client";

import { useMemo, memo, useEffect } from "react";
import SaleCard from "./SaleCard";
import {
  formatCurrency,
  formatMonthName,
  groupSalesByMonth,
  calculateMonthTotals,
} from "./utils";

// Each page represents exactly one month
const ITEMS_PER_PAGE = 1;
const MAX_VISIBLE_PAGES = 5;

const SaleHistory = memo(function SaleHistory({
  sales,
  costMap,
  imageMap,
  loading,
  page,
  onPageChange,
  onDelete,
}) {
  const salesByMonth = useMemo(() => groupSalesByMonth(sales), [sales]);

  const totalPages = Math.max(1, Math.ceil(salesByMonth.length / ITEMS_PER_PAGE));
  const safePage = Math.min(Math.max(1, page), totalPages);

  useEffect(() => {
    if (page !== safePage) {
      onPageChange(safePage);
    }
  }, [page, safePage, onPageChange]);

  const paginatedMonths = useMemo(
    () => salesByMonth.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE),
    [salesByMonth, safePage]
  );

  const totalRevenue = useMemo(
    () => sales.reduce((s, o) => s + (o.total || 0), 0),
    [sales]
  );

  if (loading) return <LoadingSkeleton />;
  if (sales.length === 0) return <EmptyState />;

  return (
    <div className="space-y-6 sm:space-y-8 w-full min-w-0 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-3 sm:gap-4 min-w-0">
        <h2 className="text-[0.65rem] sm:text-xs font-black uppercase tracking-[0.25em] text-[var(--muted)] truncate">
          Walk-in History
        </h2>
        <span className="text-[10px] sm:text-xs font-bold text-[var(--accent)] bg-[var(--surface)]/50 sm:bg-transparent px-3 py-1.5 sm:px-0 sm:py-0 rounded-lg sm:rounded-none shrink-0 w-fit">
          {sales.length} total sale{sales.length !== 1 ? "s" : ""} · {formatCurrency(totalRevenue)}
        </span>
      </div>

      <div className="space-y-6 w-full min-w-0">
        {paginatedMonths.map(([monthYear, monthSales]) => (
          <MonthGroup
            key={monthYear}
            monthYear={monthYear}
            sales={monthSales}
            costMap={costMap}
            imageMap={imageMap}
            onDelete={onDelete}
          />
        ))}
      </div>

      {totalPages > 1 && !loading && (
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
});

const MonthGroup = memo(function MonthGroup({ monthYear, sales, costMap, imageMap, onDelete }) {
  const totals = useMemo(() => calculateMonthTotals(sales, costMap), [sales, costMap]);

  return (
    <div className="space-y-3 sm:space-y-4 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-4 py-3 rounded-xl bg-[var(--surface)]/50 gap-2 shadow-sm min-w-0">
        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[var(--accent)] truncate">
          {formatMonthName(monthYear)}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-xs shrink-0">
          <span className="text-[var(--muted)]">{sales.length} sale{sales.length !== 1 ? "s" : ""}</span>
          <span className="hidden sm:inline text-[var(--muted)]">•</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            Profit: {formatCurrency(totals.profit)}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:gap-4 w-full min-w-0">
        {sales.map((sale) => (
          <SaleCard 
            key={sale.id} 
            sale={sale} 
            costMap={costMap} 
            imageMap={imageMap}
            onDelete={onDelete} 
          />
        ))}
      </div>
    </div>
  );
});

const Pagination = memo(function Pagination({ currentPage, totalPages, onPageChange }) {
  const getVisiblePages = () => {
    if (totalPages <= MAX_VISIBLE_PAGES) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const half = Math.floor(MAX_VISIBLE_PAGES / 2);
    let start = Math.max(1, currentPage - half);
    let end = start + MAX_VISIBLE_PAGES - 1;
    if (end > totalPages) { end = totalPages; start = Math.max(1, end - MAX_VISIBLE_PAGES + 1); }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };
  
  const visiblePages = getVisiblePages();
  
  return (
    <div className="flex flex-col items-center gap-4 pt-4 pb-6 w-full overflow-x-auto no-scrollbar">
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        <button 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage <= 1} 
          className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl border border-[var(--border)] hover:bg-[var(--surface)] disabled:opacity-20 transition-colors shrink-0"
          aria-label="Previous page"
        >
          ‹
        </button>
        <div className="flex items-center gap-1 sm:gap-1.5">
          {visiblePages.map((p) => (
            <button 
              key={p} 
              onClick={() => onPageChange(p)} 
              className={`min-w-[36px] sm:min-w-[40px] px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-xl border transition-colors ${
                p === currentPage 
                  ? "bg-[var(--foreground)] text-[var(--surface-strong)] border-transparent" 
                  : "border-[var(--border)] hover:bg-[var(--surface)]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <button 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage >= totalPages} 
          className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl border border-[var(--border)] hover:bg-[var(--surface)] disabled:opacity-20 transition-colors shrink-0"
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
});

function LoadingSkeleton() { 
  return (
    <div className="space-y-4 animate-pulse w-full">
      <div className="h-6 bg-[var(--surface)] rounded w-1/4 mb-8"></div>
      <div className="h-12 bg-[var(--surface)] rounded-xl w-full"></div>
      <div className="h-32 bg-[var(--surface)] rounded-xl w-full"></div>
      <div className="h-32 bg-[var(--surface)] rounded-xl w-full"></div>
    </div>
  ); 
}

function EmptyState() { 
  return (
    <div className="py-20 flex flex-col items-center justify-center text-center px-4">
      <div className="text-[var(--muted)] text-sm sm:text-base">No sales yet.</div>
    </div>
  ); 
}

export default SaleHistory;