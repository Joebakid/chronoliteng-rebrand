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
  imageMap, // <--- Add imageMap
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
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-[var(--muted)]">
          Walk-in History
        </h2>
        <span className="text-[10px] font-bold text-[var(--accent)]">
          {sales.length} total sale{sales.length !== 1 ? "s" : ""} · {formatCurrency(totalRevenue)}
        </span>
      </div>

      {paginatedMonths.map(([monthYear, monthSales]) => (
        <MonthGroup
          key={monthYear}
          monthYear={monthYear}
          sales={monthSales}
          costMap={costMap}
          imageMap={imageMap} // <--- Pass down
          onDelete={onDelete}
        />
      ))}

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
    <div className="space-y-3">
      <div className="flex items-center justify-between px-2 py-2 rounded-xl bg-[var(--surface)]/50">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
          {formatMonthName(monthYear)}
        </h3>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-[var(--muted)]">{sales.length} sale{sales.length !== 1 ? "s" : ""}</span>
          <span className="font-bold text-emerald-600">Profit: {formatCurrency(totals.profit)}</span>
        </div>
      </div>
      {sales.map((sale) => (
        <SaleCard 
          key={sale.id} 
          sale={sale} 
          costMap={costMap} 
          imageMap={imageMap} // <--- Pass down
          onDelete={onDelete} 
        />
      ))}
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
    <div className="flex flex-col items-center gap-4 pt-2 pb-4">
      <div className="flex items-center justify-center gap-2">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1} className="h-9 w-9 rounded-xl border border-[var(--border)] hover:bg-[var(--surface)] disabled:opacity-20">‹</button>
        <div className="flex items-center gap-1">
          {visiblePages.map((p) => (
            <button key={p} onClick={() => onPageChange(p)} className={`min-w-[40px] px-3 py-2 text-sm rounded-xl border ${p === currentPage ? "bg-[var(--foreground)] text-[var(--surface-strong)]" : "border-[var(--border)]"}`}>{p}</button>
          ))}
        </div>
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} className="h-9 w-9 rounded-xl border border-[var(--border)] hover:bg-[var(--surface)] disabled:opacity-20">›</button>
      </div>
    </div>
  );
});

function LoadingSkeleton() { return <div className="space-y-3 animate-pulse">Loading...</div>; }
function EmptyState() { return <div className="py-20 text-center">No sales yet.</div>; }

export default SaleHistory;