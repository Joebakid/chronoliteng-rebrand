"use client";

import Link from "next/link";
import { useState } from "react";
import { useAppContext } from "@/app/state/AppContext";
import { resolveColorSwatch } from "@/lib/colorSwatch";
import { resolveProductImage } from "@/lib/productImage";

const fmt = (n) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

export default function ProductCard({ product }) {
  const { addToCart } = useAppContext();
  const [adding, setAdding] = useState(false);

  // Safety check to ensure product exists
  if (!product) return null;

  async function handleAddToCart(event) {
    event.preventDefault();
    event.stopPropagation();
    setAdding(true);
    await addToCart(product);
    setTimeout(() => setAdding(false), 800);
  }

  /**
   * FIX: Priority change. 
   * We use product.id first. Since IDs are unique in Firebase, 
   * clicking a specific watch will always open THAT specific watch,
   * even if they share the same slug/name.
   */
  const productPath = product.id || product._id || product.slug;
  
  const isWatch = !product.category || product.category === "Watches";
  const brandName = product.collection || "Chronolite";

  return (
    <Link href={`/product/${productPath}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-[1.15rem] border border-[var(--border)] bg-[var(--card)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow)]">

        {/* Image Container */}
        <div className="relative aspect-[1.28] w-full overflow-hidden bg-[var(--card-media)]">
          <img
            src={resolveProductImage(product)}
            alt={product.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <span className="absolute left-3 top-3 rounded-full border border-[var(--border)] bg-[var(--nav)] px-3 py-1 text-[0.55rem] font-bold uppercase tracking-[0.25em] text-[var(--foreground)] backdrop-blur-md z-10">
            {brandName}
          </span>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col px-4 pb-4 pt-3 gap-3">
          <div className="flex-1 space-y-0.5">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              {brandName}
            </p>
            <h2 className="font-display text-[0.88rem] font-semibold leading-tight text-[var(--foreground)] line-clamp-1">
              {product.name}
            </h2>
            <p className="line-clamp-2 text-[0.68rem] leading-[1.45] text-[var(--muted)]">
              {product.description}
            </p>
          </div>

          {/* Specs */}
          {isWatch && (
            <div className="grid grid-cols-2 gap-x-2 border-t border-[var(--border)] pt-2 text-[0.62rem] text-[var(--muted)]">
              <p className="truncate">{product.caseSize || "40mm"}</p>
              <p className="truncate text-right">{product.movement || "Quartz"}</p>
              {product.powerSource && (
                <p className="col-span-2 mt-0.5 opacity-70">Powered by {product.powerSource}</p>
              )}
            </div>
          )}

          {/* Smart Color Swatches */}
          <div className="flex items-center gap-1.5 min-h-[14px]">
            {product.dialColor && (
              <span
                title={`Dial: ${product.dialColor}`}
                className="h-3 w-3 rounded-full border border-black/10 shadow-sm"
                style={{ backgroundColor: resolveColorSwatch(product.dialColor) }}
              />
            )}
            {product.strapColor && (
              <span
                title={`Strap: ${product.strapColor}`}
                className="h-3 w-3 rounded-sm border border-black/10 shadow-sm"
                style={{ backgroundColor: resolveColorSwatch(product.strapColor) }}
              />
            )}
            {!product.dialColor && !product.strapColor && product.colors?.map((color, i) => (
              <span
                key={i}
                className="h-2.5 w-2.5 rounded-full border border-black/10 shadow-sm"
                style={{ backgroundColor: resolveColorSwatch(color) }}
              />
            ))}
          </div>

          {/* Price + Add to cart */}
          <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
            <p className="text-[0.88rem] font-semibold text-[var(--price)]">
              {fmt(product.price)}
            </p>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={adding}
              className="rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.15em] text-[var(--foreground)] transition hover:border-[var(--foreground)] active:scale-95"
            >
              {adding ? "Adding..." : "Add to cart"}
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}