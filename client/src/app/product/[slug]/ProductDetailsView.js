"use client";

import { useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import BackHomeButton from "@/components/BackHomeButton";
import ProductGallery from "@/components/ProductGallery";
import StarButton from "@/components/StarButton";
import { resolveProductImage, resolveProductImages } from "@/lib/productImage";

export default function ProductDetailsView({ product }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const allImages = resolveProductImages(product);
  const [activeImage, setActiveImage] = useState(
    allImages[0] || resolveProductImage(product)
  );

  if (!product) return null;

  const category = product.category?.toLowerCase() || "";
  const isWatch = category === "watches";
  const isPerfume = category === "perfumes" || category === "perfume";
  const isGold = category === "gold" || category === "gold replica";

  const standardKeys = [
    "id", "_id", "slug", "inStock", "createdAt", "updatedAt", "__v", "publishedAt",
    "name", "price", "costPrice", "description", "category",
    "collection", "images", "inTransit", "transitNote", "colors",
    "caseSize", "movement", "powerSource", "strap", "dialColor", "strapColor",
    "perfumeSize", "createdBy", "weight", "watchContainer", "material",
  ];

  const customFields = Object.entries(product)
    .filter(([key, value]) => {
      if (standardKeys.includes(key)) return false;
      if (isGold && key.toLowerCase() === "material") return false;
      return value !== null && value !== undefined && value !== "" && typeof value !== "object";
    })
    .map(([key, value]) => ({
      label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      value,
    }));

  const description = product.description || "";
  const shouldTruncate = description.length > 160;
  const displayDescription =
    isExpanded || !shouldTruncate ? description : `${description.substring(0, 160)}...`;

  // watchContainer alone doesn't count as "having specs"
  const hasWatchSpecs =
    product.caseSize || product.movement || product.powerSource ||
    product.strap || product.dialColor || product.strapColor;

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
              imageUrls={allImages}
              fallbackUrl={resolveProductImage(product)}
              className="h-full w-full object-contain"
              onImageChange={(url) => setActiveImage(url)}
            />
          </div>
        </div>

        {/* RIGHT: CONTENT SECTION */}
        <div className="flex h-full flex-col justify-center space-y-8">

          <div className="space-y-4">
            <p className="text-[0.7rem] font-black uppercase tracking-[0.4em] text-[var(--accent)]">
              {product.collection || "Premium Collection"}
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              {product.name}
            </h1>
          </div>

          <div className="space-y-2">
            <p className="text-base leading-relaxed text-[var(--muted)] opacity-90 transition-all duration-300">
              {displayDescription}
            </p>
            {shouldTruncate && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                {isExpanded ? "Show Less —" : "View More +"}
              </button>
            )}
          </div>

          {/* WATCH SPECS — only renders if at least one real spec exists */}
          {isWatch && hasWatchSpecs && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
              <h3 className="text-[0.6rem] font-black uppercase tracking-[0.3em] text-[var(--muted)]">Technical Specs</h3>
              <div className="grid grid-cols-2 gap-y-6 gap-x-6 border-l-2 border-[var(--accent)] pl-6">
                <SpecItem label="Case Size" value={product.caseSize} />
                <SpecItem label="Movement" value={product.movement} />
                <SpecItem label="Power" value={product.powerSource} />
                <SpecItem label="Material" value={product.strap} />
                <SpecItem label="Dial Color" value={product.dialColor} />
                <SpecItem label="Strap Color" value={product.strapColor} />
                <SpecItem label="Container" value={product.watchContainer} />
              </div>
            </div>
          )}

          {/* GOLD SPECS */}
          {isGold && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
              <h3 className="text-[0.6rem] font-black uppercase tracking-[0.3em] text-[var(--muted)]">Product Details</h3>
              <div className="grid grid-cols-2 gap-y-6 gap-x-6 border-l-2 border-amber-500 pl-6">
                <SpecItem label="Material" value="Gold" />
                <SpecItem label="Weight" value={product.weight} />
                {customFields.map((field, i) => (
                  <SpecItem key={i} label={field.label} value={field.value} />
                ))}
              </div>
            </div>
          )}

          {/* PERFUME / CUSTOM SPECS */}
          {(!isWatch && !isGold && (isPerfume || customFields.length > 0 || product.perfumeSize)) && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
              <h3 className="text-[0.6rem] font-black uppercase tracking-[0.3em] text-[var(--muted)]">Product Details</h3>
              <div className="grid grid-cols-2 gap-y-6 gap-x-6 border-l-2 border-sky-500 pl-6">
                {product.perfumeSize && (
                  <SpecItem label="Volume / Size" value={product.perfumeSize} />
                )}
                {customFields.map((field, i) => (
                  <SpecItem key={i} label={field.label} value={field.value} />
                ))}
              </div>
            </div>
          )}

          {/* PRICE + ADD TO CART */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-[var(--border)] pt-8">
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

            <div className="flex items-center gap-3">
              <AddToCartButton product={product} selectedImage={activeImage} />
              <StarButton product={product} size="large" />
            </div>
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
      <p className="text-[0.55rem] font-bold uppercase tracking-wider text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">
        {label}
      </p>
      <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">{value}</p>
    </div>
  );
}