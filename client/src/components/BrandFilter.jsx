"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function BrandFilter({ brands = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Store brand in URL as-is, compare case-insensitively
  const currentBrand = searchParams.get("brand") || "";

  // Find the matching brand from the list (case-insensitive)
  const normalizedCurrent = brands.find(
    (b) => b.toLowerCase() === currentBrand.toLowerCase()
  ) || "";

  // Clear invalid brand param from URL
  useEffect(() => {
    if (currentBrand && !normalizedCurrent) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("brand");
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [currentBrand, normalizedCurrent, router, pathname, searchParams]);

  const handleChange = (e) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set("brand", value);
    } else {
      params.delete("brand");
    }

    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="relative inline-flex items-center">
      <select
        value={normalizedCurrent}
        onChange={handleChange}
        className="h-9 appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] pl-4 pr-10 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-[var(--accent)] cursor-pointer transition-colors hover:bg-[var(--surface)]"
      >
        <option value="">All Brands</option>
        {brands.map((brand) => (
          <option key={brand} value={brand}>
            {brand}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-3 text-[8px] text-[var(--muted)]">▼</div>
    </div>
  );
}