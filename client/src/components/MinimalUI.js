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
  selectedCategory = "Watches", // Defaulted to Watches
  selectedBrand = "", 
  searchQuery = "",
  totalFiltered = 0,
}) {

  // Standardize Brands from the current 12 products
  const availableBrands = useMemo(() => {
    const brands = products
      .map((p) => p.collection?.trim())
      .filter(Boolean);
    
    const unique = Array.from(new Set(brands.map(b => b.toUpperCase()))).sort();
    return unique;
  }, [products]);

  return (
    <section className="site-frame py-4 sm:py-10 lg:py-16">
      <div className="rounded-[2.5rem] border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-6 shadow-[var(--shadow)] sm:px-6 sm:py-10 lg:px-10">

        {/* --- HEADER --- */}
        <div className="flex flex-col gap-5 border-b border-[var(--border)] pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <Suspense fallback={<div className="h-11 w-full rounded-full bg-[var(--border)] animate-pulse" />}>
                <SearchBar initialQuery={searchQuery} />
              </Suspense>
            </div>
            <div className="shrink-0">
              <Suspense fallback={<div className="h-10 w-32 rounded-full bg-[var(--border)] animate-pulse" />}>
                <BrandFilter brands={availableBrands} />
              </Suspense>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 max-w-full">
              <Suspense fallback={<div className="h-8 w-24 rounded-full bg-[var(--border)] animate-pulse" />}>
                <CategoryFilter
                  categories={categories}
                  selectedCategory={selectedCategory}
                />
              </Suspense>
            </div>

            <p className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-[var(--muted)] shrink-0 bg-[var(--surface)] px-4 py-2 rounded-full border border-[var(--border)] shadow-sm">
              {totalFiltered} {selectedCategory} {totalFiltered === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        {/* --- GRID: 4 columns x 3 rows --- */}
        {products.length === 0 ? (
          <div className="mt-10 rounded-[2rem] border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-16 text-center">
            <h2 className="font-display text-2xl font-semibold text-[var(--foreground)] tracking-tight">
              No {selectedCategory} Found
            </h2>
            <p className="mt-2 text-xs text-[var(--muted)]">Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="mt-8 animate-in fade-in duration-700">
              <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
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

            <div className="mt-12 sm:mt-20">
              <Suspense fallback={null}>
                <Pagination
                  totalPages={totalPages}
                  currentPage={currentPage}
                  selectedCategory={selectedCategory}
                  selectedBrand={selectedBrand} 
                  searchQuery={searchQuery}
                />
              </Suspense>
            </div>
          </>
        )}
      </div>
    </section>
  );
}