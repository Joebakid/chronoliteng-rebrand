"use client";

import { memo, useMemo, useState } from "react";
import { formatCurrency, formatDate, formatDateTime, calculateSaleTotals, calculateItemTotals } from "./utils";

const SaleCard = memo(function SaleCard({ sale, costMap, imageMap, onDelete }) {
  const totals = useMemo(() => calculateSaleTotals(sale, costMap), [sale, costMap]);

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-3 sm:p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 w-full min-w-0">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-[var(--foreground)] line-clamp-1">
            {formatDate(sale.createdAt)}
          </p>
          <p className="text-[10px] text-[var(--muted)] mt-0.5 line-clamp-1">
            {formatDateTime(sale.createdAt).split(", ").slice(-1)[0]}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <p className="text-[15px] sm:text-lg font-black text-[var(--accent)]">
              {formatCurrency(sale.total)}
            </p>
            <p className={`text-[10px] font-bold ${totals.profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              Profit: {formatCurrency(totals.profit)}
            </p>
          </div>
          <button
            onClick={() => onDelete(sale.id)}
            className="text-[10px] font-bold uppercase text-red-400 hover:text-red-600 transition px-2 py-1 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 shrink-0"
          >
            Del
          </button>
        </div>
      </div>

      {/* Items List */}
      {sale.items?.length > 0 && (
        <div className="space-y-1.5 w-full min-w-0">
          {sale.items.map((item, i) => (
            <ItemRow key={i} item={item} costMap={costMap} imageMap={imageMap} />
          ))}
        </div>
      )}

      {/* Notes */}
      {sale.notes && (
        <p className="text-[11px] text-[var(--muted)] italic border-t border-[var(--border)]/50 pt-2 break-words">
          "{sale.notes}"
        </p>
      )}
    </div>
  );
});

const ItemRow = memo(function ItemRow({ item, costMap, imageMap }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const totals = useMemo(() => calculateItemTotals(item, costMap), [item, costMap]);
  const imageUrl = item.imageUrl || (imageMap && (imageMap[item.productId] || imageMap[item.name?.toLowerCase()]));

  return (
    <>
      <div className="flex items-center gap-2.5 rounded-xl  p-2 pr-3 w-full min-w-0 overflow-hidden">
        {/* Watch Image */}
        <button
          type="button"
          onClick={() => imageUrl && setIsExpanded(true)}
          disabled={!imageUrl}
          className={`h-10 w-10 shrink-0 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface-strong)] ${imageUrl ? "cursor-pointer transition hover:opacity-80 hover:ring-2 hover:ring-[var(--accent)]" : "cursor-default"}`}
        >
          {imageUrl ? (
            <img src={imageUrl} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[var(--surface-strong)] text-[8px] text-[var(--muted)]">No Img</div>
          )}
        </button>

        {/* Watch Details */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2 w-full min-w-0">
            {/* line-clamp-1 + max-w-[140px] enforces hard bounds on mobile screens */}
            <p className="text-xs font-bold line-clamp-1 max-w-[140px] xs:max-w-[180px] sm:max-w-[240px] shrink" title={item.name}>
              {item.name}
            </p>
            <p className="text-[10px] text-[var(--muted)] whitespace-nowrap shrink-0 text-right">
              {formatCurrency(item.price)} × {item.quantity}
            </p>
          </div>
          
          <div className="flex items-center gap-3 text-[10px] min-w-0">
            <span className="text-[var(--muted)] whitespace-nowrap shrink-0">
              Cost: <span className="font-medium">{formatCurrency(totals.cost)}</span>
            </span>
            <span className={`whitespace-nowrap shrink-0 ${totals.profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              Profit: <span className="font-bold">{formatCurrency(totals.profit)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isExpanded && imageUrl && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm transition-all"
          onClick={() => setIsExpanded(false)}
        >
          <div className="relative w-full max-h-[70vh] max-w-[80vw] sm:max-w-md" onClick={(e) => e.stopPropagation()}>
            <img src={imageUrl} alt={item.name} className="h-full w-full rounded-xl object-contain shadow-2xl" />
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