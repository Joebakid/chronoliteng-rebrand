// client/src/components/BrandFilter.jsx
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function BrandFilter({ brands = [], selectedBrand = "" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
        value={selectedBrand}
        onChange={handleChange}
        className="h-8 appearance-none rounded-full border border-[var(--border)] bg-[var(--surface)] pl-4 pr-9 text-[0.6rem] font-black uppercase tracking-widest text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-all hover:bg-[var(--surface-strong)] cursor-pointer"
      >
        <option value="">All Brands</option>
        {brands.map((brand) => (
          <option key={brand} value={brand}>
            {brand}
          </option>
        ))}
      </select>
      
      <div className="pointer-events-none absolute right-3 flex items-center">
        <svg width="8" height="5" viewBox="0 0 8 5" fill="none" className="text-[var(--muted)]">
          <path d="M1 1L4 4L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}