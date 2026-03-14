"use client";

import { useEffect } from "react";
import { useAppContext } from "@/app/state/AppContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useAppContext();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em]"
    >
      {theme === "dark" ? "SUN" : "MOON"}
    </button>
  );
}