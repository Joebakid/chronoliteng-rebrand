"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";

export default function Pagination({ totalPages = 1 }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentPage = Number(searchParams.get("page")) || 1;
  const safeTotalPages = Math.max(1, totalPages);

  const createPageURL = (pageNumber) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  // Logic to determine which page numbers to show
  const getVisiblePages = () => {
    const delta = 1; // Number of pages to show on either side of current
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= safeTotalPages; i++) {
      if (i === 1 || i === safeTotalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  if (safeTotalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center justify-center gap-4 mt-10 pb-10">
      {/* Optional: Page Indicator for mobile */}
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] sm:hidden">
        Page {currentPage} of {safeTotalPages}
      </p>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* PREV BUTTON */}
        <Link
          href={currentPage > 1 ? createPageURL(currentPage - 1) : "#"}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] transition ${
            currentPage > 1 
              ? "hover:bg-[var(--surface)] text-[var(--foreground)]" 
              : "opacity-20 cursor-not-allowed pointer-events-none"
          }`}
        >
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
            <path d="M5 9L1 5L5 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

        {/* PAGE NUMBERS */}
        <div className="flex items-center gap-1">
          {getVisiblePages().map((page, index) => {
            if (page === "...") {
              return (
                <span key={`dots-${index}`} className="px-2 text-[var(--muted)] text-xs">
                  ...
                </span>
              );
            }

            const isActive = page === currentPage;

            return (
              <Link
                key={index}
                href={createPageURL(page)}
                className={`flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2 text-[11px] font-black transition border ${
                  isActive
                    ? "bg-[var(--foreground)] text-[var(--surface-strong)] border-[var(--foreground)] shadow-lg"
                    : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {page}
              </Link>
            );
          })}
        </div>

        {/* NEXT BUTTON */}
        <Link
          href={currentPage < safeTotalPages ? createPageURL(currentPage + 1) : "#"}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] transition ${
            currentPage < safeTotalPages 
              ? "hover:bg-[var(--surface)] text-[var(--foreground)]" 
              : "opacity-20 cursor-not-allowed pointer-events-none"
          }`}
        >
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
            <path d="M1 9L5 5L1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>
    </div>
  );
}