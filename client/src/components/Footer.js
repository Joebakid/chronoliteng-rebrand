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
      className={`${fixedClasses} w-full border-t border-neutral-800 bg-black/95 supports-[backdrop-filter]:bg-black/80 backdrop-blur ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-3 py-3 text-xs text-gray-300 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white [font-family:var(--font-display)]">
              chronoliteng
            </span>
            <span className="font-semibold lowercase [font-family:var(--font-display)]">
              © {new Date().getFullYear()}
            </span>
            <p className="opacity-70">All Rights Reserved</p>
          </div>

          <div className="hidden items-center justify-center gap-4 sm:flex">
            <Link href="/" className="transition hover:text-white">
              Store
            </Link>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end sm:gap-3">
            <a
              href={`https://wa.me/${digits}`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-neutral-700/60 bg-neutral-900/40 px-3 py-1.5 text-[11px] text-gray-300 transition hover:border-neutral-600 hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-700 sm:w-auto"
            >
              WhatsApp
            </a>

            <a
              href="https://www.josephbawo.tech/"
              target="_blank"
              rel="noreferrer noopener"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-neutral-700/60 bg-neutral-900/40 px-3 py-1.5 text-[11px] text-gray-300 transition hover:border-neutral-600 hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-700 sm:w-auto"
            >
              <span className="opacity-80 group-hover:opacity-100">Made by</span>
              <span className="bg-gradient-to-r from-purple-400 to-sky-400 bg-clip-text font-semibold text-transparent">
                Joseph Bawo
              </span>
              <span className="opacity-60 group-hover:opacity-100">↗</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
