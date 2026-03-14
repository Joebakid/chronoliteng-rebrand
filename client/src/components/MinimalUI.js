import ProductCard from "@/components/ProductCard";

const CATEGORY_LABELS = {
  Watches: "Timepieces",
  Footwear: "Footwear",
};

export default function MinimalUI({ products }) {
  // Group products by category
  const grouped = products.reduce((acc, p) => {
    const cat = p.category || "Watches";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  return (
    <section className="site-frame py-6 sm:py-10 lg:py-16">
      <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-6 shadow-[var(--shadow)] sm:px-6 sm:py-10 lg:px-8">

        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-[0.82rem] font-semibold uppercase tracking-[0.3em] text-[var(--foreground)]">
            Curated Collection
          </p>
          <p className="text-[0.72rem] text-[var(--muted)]">
            {products.length} {products.length === 1 ? "style" : "styles"}
          </p>
        </div>

        {/* Empty state */}
        {products.length === 0 ? (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-10 text-center">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              No products yet
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold text-[var(--foreground)]">
              Upload products from the admin dashboard
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
              Add items in the admin dashboard and they will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-10">
            {categories.map((cat) => (
              <div key={cat}>
                {/* Category heading — only shown when multiple categories exist */}
                {categories.length > 1 && (
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
        )}
      </div>
    </section>
  );
}