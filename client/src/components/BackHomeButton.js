"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HiArrowLeft } from "react-icons/hi2";

export default function BackHomeButton() {
  const searchParams = useSearchParams();

  const page = searchParams.get("page");
  const category = searchParams.get("category");
  const q = searchParams.get("q");

  const params = new URLSearchParams();

  if (page) params.set("page", page);
  if (category) params.set("category", category);
  if (q) params.set("q", q);

  const backUrl = params.toString() ? `/?${params.toString()}` : "/";

  return (
    <Link
      href={backUrl}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--foreground)] transition-all hover:bg-[var(--surface-strong)] hover:scale-105 active:scale-95 shadow-sm"
    >
      <HiArrowLeft className="text-sm text-[var(--accent)]" />
      <span>Back to Store</span>
    </Link>
  );
}