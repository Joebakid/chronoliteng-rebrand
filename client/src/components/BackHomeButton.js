"use client";

import Link from "next/link";
import { HiArrowLeft } from "react-icons/hi2"; // The React Icon

export default function BackHomeButton() {
  return (
    <Link 
      href="/" 
      className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--foreground)] transition-all hover:bg-[var(--surface-strong)] hover:scale-105 active:scale-95 shadow-sm"
    >
      <HiArrowLeft className="text-sm text-[var(--accent)]" />
      <span>Back to Home</span>
    </Link>
  );
}