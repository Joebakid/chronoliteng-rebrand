"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function BrandFilter({ brands = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // FIX: Force the dropdown to respect the actual URL state and standardized casing
  const currentBrand = searchParams.get("brand")?.toUpperCase() || "";

  const handleChange = (e) => {
    const value = e.target.value.toUpperCase(); // Force uppercase selection
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) {
      params.set("brand", value);
    } else {
      params.delete("brand");
    }
    
    // Reset to first page when changing brand
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="relative inline-flex items-center">
      <select
        value={currentBrand}
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