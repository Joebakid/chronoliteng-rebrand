"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "./physical-sales/utils";

export default function TopSoldProducts({ orders = [], physicalSales = [], products = [] }) {
  const [dismissedProducts, setDismissedProducts] = useState([]);

  // Calculate top sold products
  const topSoldProducts = useMemo(() => {
    const counts = {};
    [...orders, ...physicalSales].forEach(order => {
      (order.items || []).forEach(item => {
        const name = item.name || "Unknown Product";
        counts[name] = (counts[name] || 0) + (Number(item.quantity) || 1);
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [orders, physicalSales]);

  const visibleListItems = topSoldProducts
    .filter(p => !dismissedProducts.includes(p.name))
    .slice(0, 5);

  const dismissProduct = (productName) => {
    setDismissedProducts(prev => [...prev, productName]);
  };

  if (visibleListItems.length === 0) {
    return <p className="text-xs text-[var(--muted)] text-center py-4">No sales data available.</p>;
  }

  return (
    <div className="space-y-3 relative">
      {visibleListItems.map((item, i) => {
        // Find the full product object to get image, price, etc.
        const fullProduct = products.find(p => p.name === item.name);
        const img = fullProduct?.images?.[0] || fullProduct?.image || fullProduct?.imageUrl || fullProduct?.coverImage;

        return (
          <div key={i} className="group relative flex items-center justify-between cursor-default">
            
            <span className="text-xs font-bold text-[var(--foreground)] truncate pr-4 transition-colors group-hover:text-[var(--accent)]">
              {i + 1}. {item.name}
            </span>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-[var(--surface)] border border-[var(--border)] px-2 py-1 rounded-md text-[var(--accent)] shrink-0">
                {item.count} sold
              </span>
              <button 
                onClick={() => dismissProduct(item.name)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-[var(--muted)] hover:text-red-500 font-bold p-1 rounded-md hover:bg-red-500/10"
                title="Hide from list"
              >
                ✕
              </button>
            </div>

            {/* --- HOVER TOOLTIP CARD --- */}
            {fullProduct && (
              <div className="pointer-events-none absolute bottom-full left-0 mb-2 w-[220px] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden">
                <div className="h-24 w-full bg-[var(--surface-strong)] border-b border-[var(--border)]">
                  {img ? (
                    <img src={img} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-[var(--muted)]">No Image</div>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-xs font-bold text-[var(--foreground)] line-clamp-1">{item.name}</p>
                  <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">{fullProduct.category || "Uncategorized"}</p>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs font-black text-[var(--accent)]">{formatCurrency(fullProduct.price)}</p>
                    <p className={`text-[9px] font-bold uppercase tracking-widest ${fullProduct.inStock ? "text-emerald-500" : "text-red-500"}`}>
                      {fullProduct.inStock ? "In Stock" : "Out of Stock"}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        );
      })}
    </div>
  );
}