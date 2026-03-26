"use client";

import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import CategoryFilter from "@/components/CategoryFilter";
import BrandFilter from "@/components/BrandFilter";
import SearchBar from "@/components/SearchBar";
import { Suspense, useMemo } from "react";

export default function MinimalUI({
  products = [],
  totalPages = 1,
  currentPage = 1,
  categories = [],
  selectedCategory = null,
  selectedBrand = "", 
  searchQuery = "",
  totalFiltered = 0,
}) {

  // 1. Default to 'Watches' if no category is explicitly selected by the user
  const activeCategory = selectedCategory || "Watches";

  // 2. Dynamically get unique brands based on the active category
  const availableBrands = useMemo(() => {
    const brands = products
      .filter(p => (p.category || "Watches").toLowerCase() === activeCategory.toLowerCase())
      .map((p) => p.collection)
      .filter(Boolean);
    return Array.from(new Set(brands)).sort();
  }, [products, activeCategory]);

  // 3. Group products but only for the active selection to ensure "one at a time" view
  const filteredGrouped = useMemo(() => {
    const grouped = products.reduce((acc, p) => {
      const cat = p.category || "Watches";
      // Only include the product if it matches the active category
      if (cat.toLowerCase() === activeCategory.toLowerCase()) {
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(p);
      }
      return acc;
    }, {});
    return grouped;
  }, [products, activeCategory]);

  const displayedCategories = Object.keys(filteredGrouped);

  // We hide headings if only one category is being shown (which is now always the case)
  const showCategoryHeadings = false; 

  return (
    <section className="site-frame py-6 sm:py-10 lg:py-16">
      <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-6 shadow-[var(--shadow)] sm:px-6 sm:py-10 lg:px-8">

        {/* --- HEADER SECTION: SEARCH & BRAND --- */}
        <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <Suspense fallback={
                <div className="h-10 w-full max-w-md rounded-full bg-[var(--border)] animate-pulse" />
              }>
                <SearchBar initialQuery={searchQuery} />
              </Suspense>
            </div>

            <div className="shrink-0">
              <Suspense fallback={<div className="h-9 w-28 rounded-full bg-[var(--border)] animate-pulse" />}>
                <BrandFilter 
                  brands={availableBrands} 
                  selectedBrand={selectedBrand} 
                />
              </Suspense>
            </div>
          </div>

          {/* --- SUB-HEADER: CATEGORIES (Watches / Fragrance Switcher) --- */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <Suspense fallback={<div className="h-8 w-24 rounded-full bg-[var(--border)] animate-pulse" />}>
                <CategoryFilter
                  categories={categories}
                  selectedCategory={activeCategory} // Controlled by our default logic
                />
              </Suspense>
            </div>

            {(selectedCategory || searchQuery || selectedBrand) && (
              <p className="text-[0.6rem] font-black uppercase tracking-widest text-[var(--muted)] shrink-0 bg-[var(--surface)] px-3 py-1.5 rounded-full border border-[var(--border)]">
                {totalFiltered} {totalFiltered === 1 ? "item" : "items"}
              </p>
            )}
          </div>
        </div>

        {/* --- PRODUCT GRID --- */}
        {displayedCategories.length === 0 ? (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-10 text-center">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Empty Collection
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold text-[var(--foreground)]">
              No {activeCategory} found
            </h2>
          </div>
        ) : (
          <>
            <div className="mt-6 space-y-10">
              {displayedCategories.map((cat) => (
                <div key={cat}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredGrouped[cat].map((product) => (
                      <ProductCard
                        key={product._id || product.id}
                        product={product}
                        currentPage={currentPage}
                        selectedCategory={activeCategory}
                        searchQuery={searchQuery}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Suspense fallback={null}>
              <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                selectedCategory={activeCategory}
                searchQuery={searchQuery}
              />
            </Suspense>
          </>
        )}
      </div>
    </section>
  );
}