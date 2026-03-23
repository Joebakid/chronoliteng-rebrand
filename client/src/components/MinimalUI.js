import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import CategoryFilter from "@/components/CategoryFilter";
import SearchBar from "@/components/SearchBar";
import { Suspense } from "react";

const CATEGORY_LABELS = {
  Watches: "Timepieces",
  Footwear: "Footwear",
};

export default function MinimalUI({
  products = [],
  totalPages = 1,
  currentPage = 1,
  categories = [],
  selectedCategory = null,
  searchQuery = "",
  totalFiltered = 0,
}) {
  const grouped = products.reduce((acc, p) => {
    const cat = p.category || "Watches";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const groupedCategories = Object.keys(grouped);
  const showCategoryHeadings = !selectedCategory && !searchQuery && groupedCategories.length > 1;

  return (
    <section className="site-frame py-6 sm:py-10 lg:py-16">
      <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-6 shadow-[var(--shadow)] sm:px-6 sm:py-10 lg:px-8">

        {/* Search + Filters header */}
        <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5">
          {/* Search bar */}
          <Suspense fallback={
            <div className="h-10 w-full max-w-md rounded-full bg-[var(--border)] animate-pulse" />
          }>
            <SearchBar initialQuery={searchQuery} />
          </Suspense>

          {/* Category filters + count */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Suspense fallback={
              <div className="flex gap-2">
                {categories.map((c) => (
                  <div key={c} className="h-7 w-20 rounded-full bg-[var(--border)] animate-pulse" />
                ))}
              </div>
            }>
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
              />
            </Suspense>

            {/* Result count */}
            {(selectedCategory || searchQuery) && (
              <p className="text-[0.65rem] text-[var(--muted)] shrink-0">
                {totalFiltered} {totalFiltered === 1 ? "result" : "results"}
                {searchQuery && ` for "${searchQuery}"`}
                {selectedCategory && ` in ${CATEGORY_LABELS[selectedCategory] || selectedCategory}`}
              </p>
            )}
          </div>
        </div>

        {/* Empty state */}
        {products.length === 0 ? (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-10 text-center">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              {searchQuery ? "No results found" : "No products yet"}
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold text-[var(--foreground)]">
              {searchQuery
                ? `Nothing matched "${searchQuery}"`
                : selectedCategory
                ? `No ${CATEGORY_LABELS[selectedCategory] || selectedCategory} available`
                : "Upload products from the admin dashboard"}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
              {searchQuery
                ? "Try a different search term or browse by category."
                : selectedCategory
                ? "Try a different category or check back later."
                : "Add items in the admin dashboard and they will appear here automatically."}
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
                        {CATEGORY_LABELS[cat] || cat}
                      </p>
                      <span className="flex-1 border-t border-[var(--border)]" />
                      <p className="text-[0.65rem] text-[var(--muted)]">
                        {grouped[cat].length} {grouped[cat].length === 1 ? "item" : "items"}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {grouped[cat].map((product) => (
                      <ProductCard key={product._id || product.id} product={product} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <Suspense fallback={null}>
              <Pagination totalPages={totalPages} />
            </Suspense>
          </>
        )}
      </div>
    </section>
  );
}