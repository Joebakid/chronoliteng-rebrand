"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import BackToAccountButton from "@/components/BackToAccountButton";
import PageLoader from "@/components/PageLoader";
import { useAppContext } from "@/app/state/AppContext";
import { getStarredProducts, unstarProduct } from "@/lib/api/stars";

export default function StarredPage() {
  const router = useRouter();
  const { user, authLoading } = useAppContext();

  const [starred, setStarred] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) return;

    setLoading(true);
    getStarredProducts(user.id)
      .then(setStarred)
      .catch((err) => console.error("[StarredPage] error:", err))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const handleRemove = async (productId) => {
    try {
      await unstarProduct(user.id, productId);
      setStarred((prev) => prev.filter((s) => s.productId !== productId));
    } catch (err) {
      console.error("[StarredPage] remove error:", err);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <main className="site-frame flex min-h-[60dvh] items-center justify-center">
        <PageLoader text="Verifying session..." />
      </main>
    );
  }

  // Unauthorized state
  if (!user) {
    return (
      <main className="site-frame flex min-h-[calc(100dvh-5.5rem)] items-center py-6 sm:py-8">
        <section className="w-full rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[var(--shadow)] sm:p-8">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Starred Items</p>
          <h1 className="mt-4 font-display text-3xl font-semibold text-[var(--foreground)]">Sign in to view your starred items</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
            Save watches and perfumes you love by starring them. Sign in to access your collection.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/account/sign-in?next=/account/starred"
              className="inline-flex items-center justify-center rounded-full bg-[var(--inverse-bg)] px-5 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[var(--inverse-fg)]"
            >
              Sign in
            </Link>
            <Link
              href="/account/create-account?next=/account/starred"
              className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]"
            >
              Create account
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="site-frame py-6 sm:py-8 lg:py-10">
      <div className="mb-4 flex justify-end sm:mb-6">
        <BackToAccountButton />
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Your Collection
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-[var(--foreground)]">
              Starred Items
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {starred.length} {starred.length === 1 ? "item" : "items"} saved
            </p>
          </div>
          <Link
            href="/"
            className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] hover:underline"
          >
            Continue Shopping
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 rounded-2xl bg-[var(--border)] animate-pulse" />
            ))}
          </div>
        ) : starred.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[var(--border)] py-16 text-center">
            <p className="text-4xl mb-4">☆</p>
            <p className="text-lg font-semibold text-[var(--foreground)]">No starred items yet</p>
            <p className="text-sm text-[var(--muted)] mt-2">
              Browse products and tap the star icon to save them here.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[var(--foreground)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--surface-strong)]"
            >
              Start Browsing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {starred.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] overflow-hidden shadow-sm hover:shadow-lg transition-all"
              >
                {/* Image */}
                <Link href={`/product/${item.productSlug}`} className="block">
                  <div className="aspect-[4/3] bg-white">
                    {item.productImage ? (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                        No image
                      </div>
                    )}
                  </div>
                </Link>

                {/* Details */}
                <div className="p-3">
                  <Link href={`/product/${item.productSlug}`}>
                    <p className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--accent)]">
                      {item.productCollection || "Collection"}
                    </p>
                    <h3 className="mt-0.5 text-[0.75rem] font-semibold text-[var(--foreground)] truncate">
                      {item.productName}
                    </h3>
                  </Link>
                  <p className="mt-1 text-[0.85rem] font-bold text-[var(--price)]">
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                      maximumFractionDigits: 0,
                    }).format(item.productPrice)}
                  </p>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => handleRemove(item.productId)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 shadow-md flex items-center justify-center text-xs text-amber-500 hover:bg-amber-50 transition-colors"
                  title="Remove from starred"
                >
                  ★
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
