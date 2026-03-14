"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppContext } from "@/app/state/AppContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const { cartCount, user, signOut } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <header className="sticky top-0 z-50 pt-4 px-4">
      <nav className="site-frame nav-shell rounded-[2rem] bg-[var(--nav)] px-4 py-2 backdrop-blur-xl border border-[var(--border)] shadow-[var(--shadow)] transition-all duration-300">
        
        {/* MAIN ROW: Always one line */}
        <div className="flex items-center justify-between w-full gap-2">
          
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 px-1 py-1 hover:opacity-80 transition-opacity shrink-0">
            <span className="text-[1.3rem] font-bold tracking-tighter text-[var(--foreground)]">C.</span>
            <span className="font-display text-[0.95rem] font-bold text-[var(--foreground)] hidden xs:block">Chronolite</span>
          </Link>

          {/* RIGHT SIDE GROUP: Theme + Cart + Auth/Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            <ThemeToggle />

            {/* CART */}
            <Link href="/cart" className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-1.5 sm:px-4 sm:py-2 text-[0.7rem] font-bold uppercase tracking-wider transition hover:bg-[var(--background-strong)]">
              <span className="hidden sm:inline">Cart</span>
              {/* FIXED: Replaced hardcoded gray with theme variables */}
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--inverse-bg)] text-[0.65rem] font-black text-[var(--inverse-fg)]">
                {cartCount}
              </span>
            </Link>

            {/* DESKTOP AUTH (Everything on one line) */}
            <div className="hidden lg:flex items-center gap-1 border-l border-[var(--border)] pl-2">
              {user ? (
                <>
                  <Link href="/account/profile" className="text-[0.7rem] font-bold uppercase tracking-wider px-3 py-2 hover:opacity-70">Account</Link>
                  <button 
                    onClick={() => signOut()} 
                    className="rounded-full bg-[var(--inverse-bg)] px-5 py-2 text-[0.7rem] font-bold uppercase text-[var(--inverse-fg)] transition hover:opacity-90"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/account/sign-in" className="text-[0.7rem] font-bold uppercase tracking-wider px-3 py-2 hover:opacity-70">Sign In</Link>
                  <Link 
                    href="/account/create-account" 
                    className="rounded-full bg-[var(--inverse-bg)] px-5 py-2 text-[0.7rem] font-bold uppercase text-[var(--inverse-fg)] transition hover:opacity-90"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* MOBILE HAMBURGER */}
            <button 
              onClick={() => setMenuOpen(!menuOpen)} 
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] lg:hidden active:scale-90 transition-transform"
            >
              {menuOpen ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              ) : (
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1H15M1 6H15M1 11H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* MOBILE DROPDOWN */}
        {menuOpen && (
          <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            {user ? (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/account/profile" className="rounded-xl bg-[var(--background-strong)] p-4 text-center text-[0.7rem] font-bold uppercase">Profile</Link>
                <button onClick={() => signOut()} className="rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] p-4 text-[0.7rem] font-bold uppercase">Sign Out</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/account/sign-in" className="rounded-xl bg-[var(--background-strong)] p-4 text-center text-[0.7rem] font-bold uppercase">Sign In</Link>
                <Link href="/account/create-account" className="rounded-xl bg-[var(--inverse-bg)] text-[var(--inverse-fg)] p-4 text-center text-[0.7rem] font-bold uppercase">Sign Up</Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}