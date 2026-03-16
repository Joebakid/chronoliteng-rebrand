"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";

export default function Pagination({ totalPages = 1 }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentPage = Number(searchParams.get("page")) || 1;

  const createPageURL = (pageNumber) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div className="flex items-center justify-center gap-2 mt-10 pb-10">
      {/* PREV */}
      {currentPage > 1 ? (
        <Link
          href={createPageURL(currentPage - 1)}
          className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface)] transition"
        >
          Prev
        </Link>
      ) : (
        <span className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm opacity-30 cursor-not-allowed">
          Prev
        </span>
      )}

      {/* PAGE NUMBERS */}
      <div className="flex gap-1">
        {Array.from({ length: safeTotalPages }, (_, i) => {
          const page = i + 1;
          const isActive = page === currentPage;

          return (
            <Link
              key={page}
              href={createPageURL(page)}
              className={`min-w-[40px] text-center rounded-xl mx-1 px-3 py-2 text-sm border transition ${
                isActive
                  ? "bg-orange-500 text-white border-orange-500"
                  : "border-[var(--border)] hover:bg-[var(--surface)]"
              }`}
            >
              {page}
            </Link>
          );
        })}
      </div>

      {/* NEXT */}
      {currentPage < safeTotalPages ? (
        <Link
          href={createPageURL(currentPage + 1)}
          className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface)] transition"
        >
          Next
        </Link>
      ) : (
        <span className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm opacity-30 cursor-not-allowed">
          Next
        </span>
      )}
    </div>
  );
}