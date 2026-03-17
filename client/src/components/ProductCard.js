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

  async function handleAddToCart(event) {
    event.preventDefault();
    event.stopPropagation();
    setAdding(true);
    await addToCart(product);
    setTimeout(() => setAdding(false), 800);
  }

  const productPath = product.slug || product.id || product._id;
  const isWatch = !product.category || product.category === "Watches";

  return (
    <Link href={`/product/${productPath}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-[1.15rem] border border-[var(--border)] bg-[var(--card)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(30,27,24,0.08)]">

        {/* Image Container */}
        <div className="relative aspect-[1.28] w-full overflow-hidden bg-[var(--card-media)]">
          <img
            src={resolveProductImage(product)}
            alt={product.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            loading="lazy"
          />
          {/* UPDATED: Shows Brand/Collection name instead of generic category */}
          <span className="absolute left-3 top-3 rounded-full border border-[var(--border)] bg-[var(--nav)] px-3 py-1 text-[0.55rem] font-bold uppercase tracking-[0.25em] text-[var(--foreground)] backdrop-blur-md">
            {product.collection || "Chronolite"}
          </span>
        </div>

        <div className="flex flex-1 flex-col px-4 pb-4 pt-3 gap-3">
          <div className="flex-1 space-y-0.5">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              {product.collection || "Chronolite"}
            </p>
            <h2 className="font-display text-[0.88rem] font-semibold leading-tight text-[var(--foreground)] line-clamp-1">
              {product.name}
            </h2>
            <p className="line-clamp-2 text-[0.68rem] leading-[1.45] text-[var(--muted)]">
              {product.description}
            </p>
          </div>

          {/* UPDATED: Full Specs */}
          {isWatch && (
            <div className="grid grid-cols-2 gap-x-2 border-t border-[var(--border)] pt-2 text-[0.62rem] text-[var(--muted)]">
              <p className="truncate">{product.caseSize || "40mm"}</p>
              <p className="truncate text-right">{product.movement || "Quartz"}</p>
              {product.powerSource && (
                <p className="col-span-2 mt-0.5 opacity-70">Powered by {product.powerSource}</p>
              )}
            </div>
          )}

          {/* UPDATED: Smart Color Swatches */}
          <div className="flex items-center gap-1.5 min-h-[14px]">
             {/* Dial Circle */}
            {product.dialColor && (
              <span
                title={`Dial: ${product.dialColor}`}
                className="h-3 w-3 rounded-full border border-black/10 shadow-sm"
                style={{ backgroundColor: resolveColorSwatch(product.dialColor) }}
              />
            )}
            {/* Strap Square */}
            {product.strapColor && (
              <span
                title={`Strap: ${product.strapColor}`}
                className="h-3 w-3 rounded-sm border border-black/10 shadow-sm"
                style={{ backgroundColor: resolveColorSwatch(product.strapColor) }}
              />
            )}
          </div>

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