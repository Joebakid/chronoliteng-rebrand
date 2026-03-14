"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/state/AppContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const router = useRouter();
  const { cartCount, user, signOut } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleNavigate(path) {
    setMenuOpen(false);
    router.push(path);
  }

  function handleSignOut() {
    setMenuOpen(false);
    signOut();
  }

  return (
    <header className="sticky top-0 z-30 pt-4">
      <nav className="nav-shell site-frame rounded-[1.4rem] bg-[gray] px-4 py-3 backdrop-blur sm:px-6 xl:flex xl:items-center xl:justify-between xl:px-8">
        <div className="flex items-center justify-between gap-3 xl:min-w-0">
          <button
            onClick={() => handleNavigate("/")}
            className="flex min-w-0 rounded-xl p-0.5 items-center gap-3 text-left  hover:opacity-80"
          >
            {/* Logo: Clean minimalist "C" with no border or background circle */}
            <span className="flex h-9 w-9 shrink-0 items-center justify-center text-[1.3rem] font-bold ">
              C
            </span>

            <span className="block min-w-0">
              <span className="font-display block text-[0.96rem] font-bold leading-none  sm:text-[1.02rem]">
                Chronolite
              </span>
              <span className="mt-1 hidden text-[0.68rem] uppercase tracking-[0.22em] text-[var(--muted)] sm:block">
                Watch Store
              </span>
            </span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground)] xl:hidden"
          >
            <span className="flex flex-col gap-1 rounded-xl ">
              <span className={`block h-0.5 w-4 bg-current transition-transform duration-300 ${menuOpen ? "translate-y-1.5 rotate-45" : ""}`} />
              <span className={`block h-0.5 w-4 bg-current transition-opacity duration-300 ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-4 bg-current transition-transform duration-300 ${menuOpen ? "-translate-y-1.5 -rotate-45" : ""}`} />
            </span>
          </button>
        </div>

        {/* Nav Links & Actions */}
        <div className={`${menuOpen ? "mt-4 flex" : "hidden"} flex-col gap-3 xl:mt-0 xl:flex xl:flex-row xl:items-center xl:justify-end xl:gap-3`}>
          <span className="hidden rounded-full bg-[var(--background-strong)] px-3 py-1.5 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-[var(--muted)] xl:inline-flex">
            Curated pieces
          </span>

          <ThemeToggle />

          <Link
            href="/cart"
            onClick={() => setMenuOpen(false)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] transition-colors hover:bg-[var(--background-strong)]"
          >
            Cart
            {/* Cart Bubble: Uses inverse variables for high contrast against nav */}
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[gray] px-1.5 text-[0.64rem] font-bold text-[var(--inverse-fg)]">
              {cartCount}
            </span>
          </Link>

          {user ? (
            <>
              <Link
                href={user.isAdmin ? "/admin/dashboard" : "/account/profile"}
                onClick={() => setMenuOpen(false)}
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] transition-colors hover:bg-[var(--background-strong)]"
              >
                {user.isAdmin ? "Dashboard" : "Profile"}
              </Link>
              <button
                onClick={handleSignOut}
                /* Use inverse classes to ensure high contrast in Light Mode */
                className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--inverse-bg)] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--inverse-fg)] transition-opacity hover:opacity-90"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/account/create-account"
                onClick={() => setMenuOpen(false)}
                className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] transition-colors hover:bg-[var(--background-strong)]"
              >
                Create account
              </Link>
              <Link
                href="/account/sign-in"
                onClick={() => setMenuOpen(false)}
                /* Applied Inverse Logic here to prevent the "invisible button" bug */
                className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--inverse-bg)] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--inverse-fg)] transition-opacity hover:opacity-90"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}