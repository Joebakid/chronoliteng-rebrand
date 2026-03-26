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

  // Dynamically get unique brands from the product list
  const availableBrands = useMemo(() => {
    const brands = products
      .map((p) => p.collection)
      .filter(Boolean);
    return Array.from(new Set(brands)).sort();
  }, [products]);

  const grouped = products.reduce((acc, p) => {
    const cat = p.category || "Uncategorised";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const groupedCategories = Object.keys(grouped);

  const showCategoryHeadings =
    !selectedCategory &&
    !searchQuery &&
    !selectedBrand && 
    groupedCategories.length > 1;

  return (
    <section className="site-frame py-6 sm:py-10 lg:py-16">
      <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-6 shadow-[var(--shadow)] sm:px-6 sm:py-10 lg:px-8">

        {/* --- HEADER SECTION: SEARCH & BRAND --- */}
        <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search Bar: Fills available space */}
            <div className="flex-1">
              <Suspense fallback={
                <div className="h-10 w-full max-w-md rounded-full bg-[var(--border)] animate-pulse" />
              }>
                <SearchBar initialQuery={searchQuery} />
              </Suspense>
            </div>

            {/* Brand Dropdown: Aligned with search */}
            <div className="shrink-0">
              <Suspense fallback={<div className="h-9 w-28 rounded-full bg-[var(--border)] animate-pulse" />}>
                <BrandFilter 
                  brands={availableBrands} 
                  selectedBrand={selectedBrand} 
                />
              </Suspense>
            </div>
          </div>

          {/* --- SUB-HEADER: CATEGORIES --- */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <Suspense fallback={<div className="h-8 w-24 rounded-full bg-[var(--border)] animate-pulse" />}>
                <CategoryFilter
                  categories={categories}
                  selectedCategory={selectedCategory}
                />
              </Suspense>
            </div>

            {/* Results count indicator */}
            {(selectedCategory || searchQuery || selectedBrand) && (
              <p className="text-[0.6rem] font-black uppercase tracking-widest text-[var(--muted)] shrink-0 bg-[var(--surface)] px-3 py-1.5 rounded-full border border-[var(--border)]">
                {totalFiltered} {totalFiltered === 1 ? "item" : "items"}
              </p>
            )}
          </div>
        </div>

        {/* --- PRODUCT GRID / EMPTY STATE --- */}
        {products.length === 0 ? (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-10 text-center">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              {searchQuery || selectedBrand ? "No results found" : "No products yet"}
            </p>

            <h2 className="mt-3 font-display text-2xl font-semibold text-[var(--foreground)]">
              {searchQuery
                ? `Nothing matched "${searchQuery}"`
                : selectedBrand
                ? `No ${selectedBrand} items found`
                : "Check back later"}
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
              Try removing filters or searching for something else.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 space-y-10">
              {groupedCategories.map((cat) => (
                <div key={cat}>
                  {showCategoryHeadings && (
                    <div className="mb-4 flex items-center gap-3">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                        {cat}
                      </p>
                      <span className="flex-1 border-t border-[var(--border)]" />
                      <p className="text-[0.65rem] text-[var(--muted)]">
                        {grouped[cat].length}{" "}
                        {grouped[cat].length === 1 ? "item" : "items"}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {grouped[cat].map((product) => (
                      <ProductCard
                        key={product._id || product.id}
                        product={product}
                        currentPage={currentPage}
                        selectedCategory={selectedCategory}
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
                selectedCategory={selectedCategory}
                searchQuery={searchQuery}
              />
            </Suspense>
          </>
        )}
      </div>
    </section>
  );
}