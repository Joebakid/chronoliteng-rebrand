"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function CategoryFilter({ categories = [], selectedCategory }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSelect = (cat) => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("category") === cat) {
      params.delete("category");
    } else {
      params.set("category", cat);
    }
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
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.16em] border transition ${
              isActive
                ? "bg-[var(--foreground)] text-[var(--surface-strong)] border-[var(--foreground)]"
                : "bg-transparent text-[var(--muted)] border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]"
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}