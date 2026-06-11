"use client";

import { memo, useMemo, useState } from "react";
import { formatCurrency, formatDate, formatDateTime, calculateSaleTotals, calculateItemTotals } from "./utils";

/**
 * Single sale card - memoized to prevent unnecessary re-renders
 */
const SaleCard = memo(function SaleCard({ sale, costMap, imageMap, onDelete }) {
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
            <ItemRow 
              key={i} 
              item={item} 
              costMap={costMap} 
              imageMap={imageMap} 
            />
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
const ItemRow = memo(function ItemRow({ item, costMap, imageMap }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totals = useMemo(
    () => calculateItemTotals(item, costMap),
    [item, costMap]
  );

  // Look up image from either the sale data directly or the map fallback
  const imageUrl = item.imageUrl || (imageMap && (imageMap[item.productId] || imageMap[item.name?.toLowerCase()]));

  return (
    <>
      <div className="flex items-center gap-3 rounded-xl bg-[var(--surface)] px-3 py-2">
        {/* 1. Watch Image Container */}
        {/* Change h-10 w-10 to h-8 w-8 here if you want the thumbnail even smaller */}
        <button
          type="button"
          onClick={() => imageUrl && setIsExpanded(true)}
          disabled={!imageUrl}
          className={`h-10 w-10 shrink-0 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface-strong)] ${imageUrl ? "cursor-pointer transition hover:opacity-80 hover:ring-2 hover:ring-[var(--accent)]" : "cursor-default"}`}
        >
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={item.name} 
              className="h-full w-full object-cover" 
              loading="lazy" 
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[var(--surface-strong)] text-[8px] text-[var(--muted)]">
              No Img
            </div>
          )}
        </button>

        {/* 2. Text Content */}
        <div className="flex-1 space-y-1">
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
      </div>

      {/* 3. Full Screen Image Modal */}
      {isExpanded && imageUrl && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm transition-all"
          onClick={() => setIsExpanded(false)}
        >
          {/* UPDATED: Reduced max height to 70vh and max width to a medium breakpoint (max-w-md) */}
          <div className="relative w-full max-h-[70vh] max-w-[80vw] sm:max-w-md">
            <img 
              src={imageUrl} 
              alt={item.name} 
              className="h-full w-full rounded-xl object-contain shadow-2xl"
            />
            <button 
              onClick={() => setIsExpanded(false)}
              className="absolute -right-4 -top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--foreground)] shadow-lg hover:bg-red-500 hover:text-white transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
});

export default SaleCard;