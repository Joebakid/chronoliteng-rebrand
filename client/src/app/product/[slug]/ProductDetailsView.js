"use client";

import { useState } from "react";
// Import your ORIGINAL component names from their original locations
import AddToCartButton from "@/components/AddToCartButton";
import BackHomeButton from "@/components/BackHomeButton";
import ProductGallery from "@/components/ProductGallery";
import { resolveColorSwatch } from "@/lib/colorSwatch";
import { resolveProductImage, resolveProductImages } from "@/lib/productImage";

export default function ProductDetailsView({ product }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!product) return null;

  // Truncate logic for "Read More"
  const description = product.description || "";
  const shouldShowReadMore = description.length > 280;
  const displayedDescription = isExpanded ? description : description.slice(0, 280) + "...";

  return (
    <main className="site-frame flex min-h-screen flex-col py-6 sm:py-10">
      <div className="mb-6 flex justify-end">
        <BackHomeButton />
      </div>

      <div className="grid flex-1 gap-12 lg:grid-cols-2 lg:items-start">
        
        {/* LEFT: GALLERY SECTION - Border REMOVED */}
        <div className="lg:sticky lg:top-28">
          <div className="aspect-square w-full overflow-hidden rounded-[3rem]   p-6 shadow-2xl sm:p-12">
            <ProductGallery
              imageUrls={resolveProductImages(product)}
              fallbackUrl={resolveProductImage(product)}
              className="h-full w-full object-contain"
            //   colorIndicators={(product.colors || []).map(resolveColorSwatch)}
            />
          </div>
        </div>

        {/* RIGHT: CONTENT SECTION */}
        <div className="flex h-full flex-col justify-center space-y-10">
          
          <div className="space-y-4">
            <p className="text-[0.7rem] font-black uppercase tracking-[0.4em] text-[var(--accent)]">
              {product.collection || "Chronolite Collection"}
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              {product.name}
            </h1>
          </div>

          {/* Description Block with "Read More" */}
          <div className="space-y-4">
            <p className="text-lg leading-relaxed text-[var(--muted)] opacity-90 transition-all">
              {displayedDescription}
            </p>
            {shouldShowReadMore && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[0.7rem] font-black uppercase tracking-widest text-[var(--foreground)] border-b-2 border-[var(--accent)] pb-1 hover:text-[var(--accent)] transition-colors"
              >
                {isExpanded ? "Show Less" : "Read More"}
              </button>
            )}
          </div>

          {/* Specifications Grid */}
          <div className="space-y-6">
            <h3 className="text-[0.7rem] font-black uppercase tracking-[0.3em] text-[var(--muted)]">Technical Specs</h3>
            
            <div className="grid grid-cols-2 gap-y-8 gap-x-6 border-l-2 border-[var(--border)] pl-6 text-sm">
              <SpecItem label="Case Size" value={product.caseSize} fallback="40mm" />
              <SpecItem label="Movement" value={product.movement} fallback="Quartz" />
              <SpecItem label="Power Source" value={product.powerSource} fallback="Battery" />
              <SpecItem label="Material" value={product.strap} fallback="Leather/Resin" />
              <SpecItem label="Dial Color" value={product.dialColor} fallback="Black" />
              <SpecItem label="Strap Color" value={product.strapColor} fallback="Default" />
            </div>
          </div>

          {/* Simplified Checkout Layout (Updated) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-[var(--border)] pt-10">
          <div className="flex flex-col items-start text-left">
  <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-[var(--muted)] mb-1">
    Retail Price
  </p>

  <p className="text-4xl font-bold text-[var(--price)]">
    {new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(product.price)}
  </p>
</div>
            
            {/* Reverting to your original AddToCartButton component */}
            <AddToCartButton product={product} />
          </div>

        </div>
      </div>
    </main>
  );
}

// Helper component for specifications grid
function SpecItem({ label, value, fallback }) {
  return (
    <div>
      <p className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--muted)]">{label}</p>
      <p className="text-base font-semibold text-[var(--foreground)] mt-1">{value || fallback}</p>
    </div>
  );
}