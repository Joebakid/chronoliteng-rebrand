"use client";

import { useEffect, useState } from "react";
import { useAppContext } from "@/app/state/AppContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useAppContext();
  const [mounted, setMounted] = useState(false);
  const label = mounted ? (theme === "dark" ? "MOON" : "SUN") : "THEME";

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] sm:px-4 sm:text-[0.74rem]"
    >
      {label}
    </button>
  );
}
