"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function CategoryFilter({ categories = [], selectedCategory }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSelect = (cat) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Check if we are deselecting the current category
    const isCurrent = params.get("category") === cat;

    if (isCurrent) {
      params.delete("category");
    } else {
      params.set("category", cat);
    }

    // --- CRITICAL FIXES ---
    // 1. Clear brand when changing categories to prevent "No products found" bugs
    params.delete("brand"); 
    
    // 2. Clear search query to give a fresh start in the new category
    params.delete("q"); 

    // 3. Reset to page 1
    params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {categories.map((cat) => {
        const isActive = selectedCategory === cat;
        return (
          <button
            key={cat}
            onClick={() => handleSelect(cat)}
            className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-200 ${
              isActive
                ? "bg-[var(--foreground)] text-[var(--surface-strong)] border-[var(--foreground)] shadow-sm"
                : "bg-[var(--surface-strong)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--muted)]"
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}