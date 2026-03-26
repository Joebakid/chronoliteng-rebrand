"use client";

import Link from "next/link";

export default function CheckoutSuccess({ user }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-300">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 text-green-500">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold uppercase tracking-tight text-[var(--foreground)]">
        Payment Successful!
      </h2>
      <p className="mt-3 max-w-xs text-sm text-[var(--muted)]">
        Your order has been placed successfully. {user ? "You can track it in your profile." : "We've sent a receipt to your email."}
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="rounded-full bg-[var(--inverse-bg)] px-8 py-3 text-[0.7rem] font-bold uppercase tracking-widest text-[var(--inverse-fg)] transition hover:opacity-90"
        >
          Back to Shop
        </Link>
        
        {user && (
          <Link
            href="/account/profile"
            className="rounded-full border border-[var(--border)] px-8 py-3 text-[0.7rem] font-bold uppercase tracking-widest transition hover:bg-[var(--surface)]"
          >
            View Orders
          </Link>
        )}
      </div>
    </div>
  );
}