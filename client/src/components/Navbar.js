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
      <nav className="nav-shell site-frame rounded-[1.4rem] border border-[var(--border)] bg-[var(--nav)] px-4 py-3 backdrop-blur sm:px-6 xl:flex xl:items-center xl:justify-between xl:px-8">
        <div className="flex items-center justify-between gap-3 xl:min-w-0">
          <button
            onClick={() => handleNavigate("/")}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--inverse-bg)] text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--inverse-fg)]">
              C
            </span>

            <span className="block min-w-0">
              <span className="font-display block text-[0.96rem] font-bold leading-none text-[var(--foreground)] sm:text-[1.02rem]">
                Chronolite
              </span>
              <span className="mt-1 hidden text-[0.68rem] uppercase tracking-[0.22em] text-[var(--muted)] sm:block">
                Watch Store
              </span>
            </span>
          </button>

          <button
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground)] xl:hidden"
          >
            <span className="flex flex-col gap-1">
              <span className={`block h-0.5 w-4 bg-current transition ${menuOpen ? "translate-y-1.5 rotate-45" : ""}`} />
              <span className={`block h-0.5 w-4 bg-current transition ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-4 bg-current transition ${menuOpen ? "-translate-y-1.5 -rotate-45" : ""}`} />
            </span>
          </button>
        </div>

        <div className={`${menuOpen ? "mt-3 flex" : "hidden"} flex-col gap-2 xl:mt-0 xl:flex xl:flex-row xl:items-center xl:justify-end xl:gap-3`}>
          <span className="hidden rounded-full bg-[var(--background-strong)] px-3 py-1.5 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-[var(--muted)] xl:inline-flex">
            Curated pieces
          </span>

          <ThemeToggle />

          <Link
            href="/cart"
            onClick={() => setMenuOpen(false)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]"
          >
            Cart
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--inverse-bg)] px-1.5 text-[0.64rem] text-[var(--inverse-fg)]">
              {cartCount}
            </span>
          </Link>

          {user ? (
            <>
              <Link
                href={user.isAdmin ? "/admin/dashboard" : "/account/profile"}
                onClick={() => setMenuOpen(false)}
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] sm:px-4 sm:text-[0.72rem]"
              >
                <span className="xl:hidden">{user.isAdmin ? "Dashboard" : "Profile"}</span>
                <span className="hidden xl:inline">{user.isAdmin ? "Dashboard" : user.name}</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--inverse-bg)] px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--inverse-fg)] transition hover:opacity-88 sm:px-4 sm:text-[0.74rem]"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/account/create-account"
                onClick={() => setMenuOpen(false)}
                className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] sm:px-4 sm:text-[0.74rem]"
              >
                Create account
              </Link>
              <Link
                href="/account/sign-in"
                onClick={() => setMenuOpen(false)}
                className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--inverse-bg)] px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--inverse-fg)] transition hover:opacity-88 sm:px-4 sm:text-[0.74rem]"
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
