"use client";

import Link from "next/link";

export default function Footer({
  className = "",
  whatsAppNumber = "2349013550698",
  fixed = false,
}) {
  const digits = whatsAppNumber.replace(/[^\d]/g, "");
  const fixedClasses = fixed ? "fixed bottom-0 left-0 z-40" : "";

  return (
    <footer
      role="contentinfo"
      /* FIXED: Removed bg-black/95 and hardcoded neutral borders */
      className={`${fixedClasses} w-full border-t border-[var(--border)] bg-[var(--nav)] backdrop-blur transition-colors duration-300 ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-3 py-3 text-xs sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--foreground)] [font-family:var(--font-display)]">
              chronoliteng
            </span>
            <span className="font-semibold lowercase text-[var(--foreground)] [font-family:var(--font-display)]">
              © {new Date().getFullYear()}
            </span>
            <p className="text-[var(--muted)] opacity-70">All Rights Reserved</p>
          </div>

          <div className="hidden items-center justify-center gap-4 sm:flex">
            <Link href="/" className="text-[var(--muted)] transition hover:text-[var(--foreground)]">
              Store
            </Link>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end sm:gap-3">
            <a
              href={`https://wa.me/${digits}`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-1.5 text-[11px] text-[var(--foreground)] transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] sm:w-auto"
            >
              WhatsApp
            </a>

            <a
              href="https://www.josephbawo.tech/"
              target="_blank"
              rel="noreferrer noopener"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-1.5 text-[11px] text-[var(--foreground)] transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] sm:w-auto"
            >
              <span className="opacity-80 group-hover:opacity-100 text-[var(--muted)]">Made by</span>
              <span className="bg-gradient-to-r from-purple-400 to-sky-400 bg-clip-text font-semibold text-transparent">
                Joseph Bawo
              </span>
              <span className="opacity-60 group-hover:opacity-100 text-[var(--foreground)]">↗</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}