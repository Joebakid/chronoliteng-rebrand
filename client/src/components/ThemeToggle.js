"use client";

import { useEffect, useState } from "react";
import { useAppContext } from "@/app/state/AppContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useAppContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Sync the attribute on initial load
    if (theme) {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  if (!mounted) return <div className="h-9 w-16" />; // Spacer for hydration

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]"
    >
      {theme === "dark" ? "MOON" : "SUN"}
    </button>
  );
}