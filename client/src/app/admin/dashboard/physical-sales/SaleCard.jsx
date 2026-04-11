"use client";

import { memo, useMemo } from "react";
import { formatCurrency, formatDate, formatDateTime, calculateSaleTotals, calculateItemTotals } from "./utils";

/**
 * Single sale card - memoized to prevent unnecessary re-renders
 */
const SaleCard = memo(function SaleCard({ sale, costMap, onDelete }) {
  // Calculate totals once
  const totals = useMemo(
    () => calculateSaleTotals(sale, costMap),
    [sale, costMap]
  );

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 shadow-sm space-y-3 ml-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-[var(--foreground)]">
            {formatDate(sale.createdAt)}
          </p>
          <p className="text-[10px] text-[var(--muted)] mt-0.5">
            {formatDateTime(sale.createdAt).split(", ").slice(-1)[0]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-lg font-black text-[var(--accent)]">
              {formatCurrency(sale.total)}
            </p>
            <p className={`text-[10px] font-bold ${totals.profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              Profit: {formatCurrency(totals.profit)}
            </p>
          </div>
          <button
            onClick={() => onDelete(sale.id)}
            className="text-[10px] font-bold uppercase text-red-400 hover:text-red-600 transition px-2 py-1 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100"
          >
            Del
          </button>
        </div>
      </div>

      {/* Items */}
      {sale.items?.length > 0 && (
        <div className="space-y-1.5">
          {sale.items.map((item, i) => (
            <ItemRow key={i} item={item} costMap={costMap} />
          ))}
        </div>
      )}

      {/* Notes */}
      {sale.notes && (
        <p className="text-[11px] text-[var(--muted)] italic border-t border-[var(--border)]/50 pt-2">
          "{sale.notes}"
        </p>
      )}
    </div>
  );
});

/**
 * Item row - memoized
 */
const ItemRow = memo(function ItemRow({ item, costMap }) {
  const totals = useMemo(
    () => calculateItemTotals(item, costMap),
    [item, costMap]
  );

  return (
    <div className="rounded-xl bg-[var(--surface)] px-3 py-2 space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold truncate">{item.name}</p>
        <p className="text-[10px] text-[var(--muted)] flex-shrink-0 ml-2">
          {formatCurrency(item.price)} × {item.quantity}
        </p>
      </div>
      <div className="flex items-center gap-4 text-[10px]">
        <span className="text-[var(--muted)]">
          Cost: <span className="font-medium">{formatCurrency(totals.cost)}</span>
        </span>
        <span className={totals.profit >= 0 ? "text-emerald-600" : "text-red-500"}>
          Profit: <span className="font-bold">{formatCurrency(totals.profit)}</span>
        </span>
      </div>
    </div>
  );
});

export default SaleCard;
