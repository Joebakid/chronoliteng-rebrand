"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "./physical-sales/utils"; 

// Set how many products you want to see per page
const ITEMS_PER_PAGE = 6; 

export default function SupplierTab({ products = [] }) {
  // 1. Group products by source
  const groupedBySource = useMemo(() => {
    const groups = {};
    
    products.forEach((product) => {
      const sourceName = product.source?.trim() || "Uncategorized";
      
      if (!groups[sourceName]) {
        groups[sourceName] = {
          name: sourceName,
          products: [],
          totalCost: 0,
        };
      }
      
      groups[sourceName].products.push(product);
      
      const cost = parseFloat(product.costPrice) || 0;
      const qty = parseInt(product.inStock) || 1; 
      groups[sourceName].totalCost += (cost * qty);
    });

    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  // 2. States for supplier, search, and pagination
  const [selectedSource, setSelectedSource] = useState(
    groupedBySource.length > 0 ? groupedBySource[0].name : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1); // <-- New Pagination State

  const activeGroup = groupedBySource.find((g) => g.name === selectedSource);

  // 3. Filter products based on search query
  const displayedProducts = useMemo(() => {
    if (!activeGroup) return [];
    if (!searchQuery.trim()) return activeGroup.products;

    const query = searchQuery.toLowerCase();
    return activeGroup.products.filter(
      (product) =>
        product.name?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
    );
  }, [activeGroup, searchQuery]);

  // 4. Calculate pagination slice
  const totalPages = Math.max(1, Math.ceil(displayedProducts.length / ITEMS_PER_PAGE));
  
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return displayedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [displayedProducts, currentPage]);

  // Handlers to reset page when switching contexts
  const handleSourceChange = (name) => {
    setSelectedSource(name);
    setSearchQuery("");
    setCurrentPage(1); // Reset to page 1
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to page 1 while searching
  };

  if (products.length === 0) {
    return <div className="py-20 text-center text-[var(--muted)]">No products found.</div>;
  }

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] lg:items-start">
      
      {/* LEFT SIDE: List of Suppliers */}
      <div className="order-1 flex flex-col gap-2 lg:sticky lg:top-24">
        <h2 className="px-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
          Suppliers & Sources
        </h2>
        <div className="flex flex-col gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]/30 p-2 shadow-sm">
          {groupedBySource.map((group) => (
            <button
              key={group.name}
              onClick={() => handleSourceChange(group.name)}
              className={`flex items-center justify-between rounded-xl px-4 py-3 text-left transition-all ${
                selectedSource === group.name
                  ? "bg-[var(--foreground)] text-[var(--surface)] shadow-md"
                  : "hover:bg-[var(--surface)] text-[var(--foreground)]"
              }`}
            >
              <span className="text-sm font-bold truncate max-w-[180px]">
                {group.name}
              </span>
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                selectedSource === group.name 
                  ? "bg-[var(--surface)]/20 text-[var(--surface)]" 
                  : "bg-[var(--surface-strong)] text-[var(--muted)]"
              }`}>
                {group.products.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: Products for Selected Supplier */}
      <div className="order-2 space-y-4">
        {activeGroup && (
          <>
            {/* Header & Search Bar Row */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
              <div>
                <h2 className="text-lg font-black text-[var(--foreground)]">
                  {activeGroup.name === "Uncategorized" ? "No Supplier Assigned" : activeGroup.name}
                </h2>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {displayedProducts.length} item(s) found
                </p>
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:max-w-xs">
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-4 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] shadow-sm"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] opacity-50">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Empty State vs Grid */}
            {displayedProducts.length === 0 ? (
              <div className="py-12 text-center text-[var(--muted)] border border-dashed border-[var(--border)] rounded-2xl">
                No items match "{searchQuery}"
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {paginatedProducts.map((product) => {
                    const img = product.images?.[0] || product.image || product.imageUrl || product.coverImage;
                    
                    return (
                      <div key={product.id} className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] shadow-sm transition hover:shadow-md">
                        {/* Image Area */}
                        <div className="relative h-40 w-full bg-[var(--surface)] border-b border-[var(--border)]">
                          {img ? (
                            <img src={img} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-[var(--muted)]">No Image</div>
                          )}
                          <div className="absolute top-2 right-2 rounded-md bg-black/70 px-2 py-1 text-[9px] font-bold tracking-widest text-white backdrop-blur-sm uppercase">
                            {product.category || "Item"}
                          </div>
                        </div>
                        
                        {/* Details Area */}
                        <div className="flex flex-1 flex-col p-4 space-y-2">
                          <h3 className="text-sm font-bold text-[var(--foreground)] line-clamp-1">{product.name}</h3>
                          <div className="mt-auto flex items-end justify-between pt-2">
                            <div>
                              <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Selling Price</p>
                              <p className="font-bold text-[var(--accent)]">{formatCurrency(product.price)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Cost Price</p>
                              <p className="font-medium text-[var(--foreground)]">{product.costPrice ? formatCurrency(product.costPrice) : "—"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* --- PAGINATION CONTROLS --- */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-[var(--border)]/50 pt-4">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-[var(--border)] hover:bg-[var(--surface)] disabled:opacity-30 disabled:hover:bg-transparent transition"
                    >
                      Previous
                    </button>
                    
                    <span className="text-xs font-bold text-[var(--muted)]">
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-[var(--border)] hover:bg-[var(--surface)] disabled:opacity-30 disabled:hover:bg-transparent transition"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}