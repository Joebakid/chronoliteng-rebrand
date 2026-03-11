import ProductCard from "@/components/ProductCard";

export default function MinimalUI({ products }) {
  return (
    <section className="site-frame py-6 sm:py-10 lg:py-16">
      <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-6 shadow-[var(--shadow)] sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-2 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="font-display text-[0.82rem] font-semibold uppercase tracking-[0.3em] text-[var(--foreground)]">
            Watch 
          </p>
          <p className="text-[0.72rem] text-[var(--muted)]">{products.length} styles</p>
        </div>

        {products.length === 0 ? (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-10 text-center">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              No products yet
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold text-[var(--foreground)]">
              Upload products from the admin dashboard
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
              The storefront now shows only real products from your database. Add items in the admin dashboard and they will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
