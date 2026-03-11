"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackHomeButton from "@/components/BackHomeButton";
import { useAppContext } from "@/app/state/AppContext";
import { getPurchaseHistory } from "@/lib/purchaseHistory";

function formatPrice(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPurchaseDate(value) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAppContext();
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    if (!user) return;
    if (user.isAdmin) {
      router.replace("/admin/dashboard");
      return;
    }
    setPurchases(getPurchaseHistory(user));
  }, [router, user]);

  if (!user) {
    return (
      <main className="site-frame flex min-h-[calc(100dvh-5.5rem)] items-center py-6 sm:py-8">
        <section className="w-full rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[var(--shadow)] sm:p-8">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
            Profile
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold text-[var(--foreground)]">
            Sign in to view your account
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
            Your profile and purchase history are available after you sign in.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/account/sign-in?next=/account/profile"
              className="inline-flex items-center justify-center rounded-full bg-[var(--inverse-bg)] px-5 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[var(--inverse-fg)]"
            >
              Sign in
            </Link>
            <Link
              href="/account/create-account?next=/account/profile"
              className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]"
            >
              Create account
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (user.isAdmin) {
    return null;
  }

  return (
    <main className="site-frame py-6 sm:py-8 lg:py-10">
      <div className="mb-4 flex justify-end sm:mb-6">
        <BackHomeButton />
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[var(--shadow)] sm:p-8">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
            Account profile
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold text-[var(--foreground)]">
            {user.name}
          </h1>
          <div className="mt-6 space-y-4 text-sm text-[var(--muted)]">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]">
                Email
              </p>
              <p className="mt-2 text-base text-[var(--foreground)]">{user.email}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]">
                Purchase count
              </p>
              <p className="mt-2 text-base text-[var(--foreground)]">{purchases.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[var(--shadow)] sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                Purchase history
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold text-[var(--foreground)]">
                Your recorded purchases
              </h2>
            </div>
          </div>

          {purchases.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-6 text-sm text-[var(--muted)]">
              No purchases recorded yet. When you check out while signed in, they will appear here.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {purchases.map((purchase) => (
                <article
                  key={purchase.id}
                  className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                        {formatPurchaseDate(purchase.createdAt)}
                      </p>
                      <p className="mt-2 text-base font-semibold text-[var(--foreground)]">
                        {purchase.items.length} item{purchase.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <p className="text-base font-semibold text-[var(--price)]">
                      {formatPrice(purchase.total)}
                    </p>
                  </div>

                  <div className="mt-4 space-y-3">
                    {purchase.items.map((item) => (
                      <div
                        key={`${purchase.id}-${item.slug}`}
                        className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                      >
                        <div>
                          <p className="font-medium text-[var(--foreground)]">{item.name}</p>
                          <p className="mt-1 text-[var(--muted)]">
                            Qty {item.quantity} x {formatPrice(item.price)}
                          </p>
                        </div>
                        <p className="font-semibold text-[var(--foreground)]">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
