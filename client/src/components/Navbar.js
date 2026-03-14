"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppContext } from "@/app/state/AppContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const { cartCount, user, signOut } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleSignOut() {
    setMenuOpen(false);
    signOut();
  }

  return (
    <header className="sticky top-0 z-30 pt-4">
      <nav className="site-frame nav-shell rounded-[1.6rem] bg-[var(--nav)] px-5 py-3 backdrop-blur-xl border border-[var(--border)] shadow-[var(--shadow)] xl:flex xl:items-center xl:justify-between">

        {/* LEFT SIDE */}
        <div className="flex items-center justify-between gap-4 xl:min-w-0">

          {/* LOGO */}
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 rounded-xl hover:opacity-80 transition-opacity"
          >
            {/* Monogram */}
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[1.05rem] font-semibold tracking-wide">
              C
            </span>

            {/* Brand */}
            <span className="flex flex-col leading-none">
              <span className="font-display text-[1rem] font-semibold tracking-[0.05em]">
                Chronolite
              </span>

              <span className="hidden text-[0.65rem] uppercase tracking-[0.35em] text-[var(--muted)] sm:block">
                Watches
              </span>
            </span>
          </Link>

          {/* MOBILE MENU BUTTON */}
          <button
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] xl:hidden"
          >
            <span className="flex flex-col gap-1.5">
              <span className={`block h-[2px] w-4 bg-current transition ${menuOpen ? "translate-y-[6px] rotate-45" : ""}`} />
              <span className={`block h-[2px] w-4 bg-current transition ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block h-[2px] w-4 bg-current transition ${menuOpen ? "-translate-y-[6px] -rotate-45" : ""}`} />
            </span>
          </button>
        </div>

        {/* RIGHT SIDE */}
        <div className={`${menuOpen ? "mt-5 flex" : "hidden"} flex-col gap-3 xl:mt-0 xl:flex xl:flex-row xl:items-center xl:gap-3`}>

          {/* Curated Label */}
          <span className="hidden rounded-full bg-[var(--background-strong)] px-3 py-1.5 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-[var(--muted)] xl:inline-flex">
            Curated Pieces
          </span>

          <ThemeToggle />

          {/* CART */}
          <Link
            href="/cart"
            onClick={() => setMenuOpen(false)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] transition hover:bg-[var(--background-strong)]"
          >
            Cart
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--inverse-bg)] px-1.5 text-[0.6rem] font-bold text-[var(--inverse-fg)]">
              {cartCount}
            </span>
          </Link>

          {user ? (
            <>
              <Link
                href={user.isAdmin ? "/admin/dashboard" : "/account/profile"}
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] transition hover:bg-[var(--background-strong)]"
              >
                {user.isAdmin ? "Dashboard" : "Profile"}
              </Link>

              <button
                onClick={handleSignOut}
                className="rounded-full border border-[var(--border)] bg-[var(--inverse-bg)] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--inverse-fg)] hover:opacity-90"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/account/create-account"
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] transition hover:bg-[var(--background-strong)]"
              >
                Create Account
              </Link>

              <Link
                href="/account/sign-in"
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--inverse-bg)] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--inverse-fg)] hover:opacity-90"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}