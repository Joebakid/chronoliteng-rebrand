"use client";

import { useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import BackHomeButton from "@/components/BackHomeButton";
import ProductGallery from "@/components/ProductGallery";
import { resolveProductImage, resolveProductImages } from "@/lib/productImage";

export default function ProductDetailsView({ product }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!product) return null;

  const description = product.description || "";
  const shouldShowReadMore = description.length > 280;
  const displayedDescription = isExpanded ? description : description.slice(0, 280) + "...";

  // Category Checks
  const category = product.category?.toLowerCase() || "";
  const isWatch = category === "watches";
  const isPerfume = category === "perfumes" || category === "perfume";

  /**
   * DYNAMIC FIELD LOGIC
   * We filter out internal/standard keys to find only the "Custom Fields"
   */
  const standardKeys = [
    // Database & System fields (Hide these)
    "id", "_id", "slug", "inStock", "createdAt", "updatedAt", "__v", "publishedAt",
    
    // Core Form fields
    "name", "price", "costPrice", "description", "category", 
    "collection", "images", "inTransit", "transitNote", "colors",
    
    // Watch-Specific fields (Rendered in their own section)
    "caseSize", "movement", "powerSource", "strap", "dialColor", "strapColor",
    
    // Custom Perfume field (Rendered separately)
    "perfumeSize"
  ];

  const customFields = Object.entries(product)
    .filter(([key, value]) => {
      // 1. Skip if it's in the hide list
      if (standardKeys.includes(key)) return false;
      // 2. Only show if it has a valid value and isn't a complex object/array
      return value !== null && value !== undefined && value !== "" && typeof value !== 'object';
    })
    .map(([key, value]) => ({
      // Clean label: "strap_type" -> "Strap Type"
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: value
    }));

  return (
    <main className="site-frame flex min-h-screen flex-col py-6 sm:py-10">
      <div className="mb-6 flex justify-end">
        <BackHomeButton />
      </div>

      <div className="grid flex-1 gap-12 lg:grid-cols-2 lg:items-start">
        
        {/* LEFT: GALLERY SECTION */}
        <div className="lg:sticky lg:top-28">
          <div className="aspect-square w-full overflow-hidden rounded-[3rem] p-6 shadow-2xl sm:p-12 border border-[var(--border)] bg-[var(--surface)]">
            <ProductGallery
              imageUrls={resolveProductImages(product)}
              fallbackUrl={resolveProductImage(product)}
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        {/* RIGHT: CONTENT SECTION */}
        <div className="flex h-full flex-col justify-center space-y-10">
          
          <div className="space-y-4">
            <p className="text-[0.7rem] font-black uppercase tracking-[0.4em] text-[var(--accent)]">
              {product.collection || "Premium Collection"}
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              {product.name}
            </h1>
          </div>

          <div className="space-y-4">
            <p className="text-lg leading-relaxed text-[var(--muted)] opacity-90 transition-all">
              {displayedDescription}
            </p>
            {shouldShowReadMore && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[0.7rem] font-black uppercase tracking-widest text-[var(--foreground)] border-b-2 border-[var(--accent)] pb-1"
              >
                {isExpanded ? "Show Less" : "Read More"}
              </button>
            )}
          </div>

          {/* --- WATCH SPECS --- */}
          {isWatch && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
              <h3 className="text-[0.7rem] font-black uppercase tracking-[0.3em] text-[var(--muted)]">Technical Specs</h3>
              <div className="grid grid-cols-2 gap-y-8 gap-x-6 border-l-2 border-[var(--accent)] pl-6">
                <SpecItem label="Case Size" value={product.caseSize} />
                <SpecItem label="Movement" value={product.movement} />
                <SpecItem label="Power" value={product.powerSource} />
                <SpecItem label="Material" value={product.strap} />
                <SpecItem label="Dial Color" value={product.dialColor} />
                <SpecItem label="Strap Color" value={product.strapColor} />
              </div>
            </div>
          )}

          {/* --- PERFUME / CUSTOM SPECS --- */}
          {(!isWatch && (isPerfume || customFields.length > 0 || product.perfumeSize)) && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
              <h3 className="text-[0.7rem] font-black uppercase tracking-[0.3em] text-[var(--muted)]">Product Details</h3>
              <div className="grid grid-cols-2 gap-y-8 gap-x-6 border-l-2 border-sky-500 pl-6">
                {/* Specific field for Perfume Size */}
                {product.perfumeSize && (
                  <SpecItem label="Volume / Size" value={product.perfumeSize} />
                )}
                
                {/* Render any dynamically added fields */}
                {customFields.map((field, i) => (
                  <SpecItem key={i} label={field.label} value={field.value} />
                ))}
              </div>
            </div>
          )}

          {/* Checkout Layout */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-[var(--border)] pt-10">
            <div className="flex flex-col items-start text-left">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-[var(--muted)] mb-1">Retail Price</p>
              <p className="text-4xl font-bold text-[var(--price)]">
                {new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: "NGN",
                  maximumFractionDigits: 0,
                }).format(product.price)}
              </p>
            </div>
            
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
    </main>
  );
}

function SpecItem({ label, value }) {
  if (!value) return null;
  return (
    <div className="group">
      <p className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">
        {label}
      </p>
      <p className="text-base font-semibold text-[var(--foreground)] mt-1">{value}</p>
    </div>
  );
}