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

        {/* Image */}
        <div className="relative aspect-[1.28] w-full overflow-hidden bg-[var(--card-media)]">
          <img
            src={resolveProductImage(product)}
            alt={product.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            loading="lazy"
          />
          {product.category && (
            <span className="absolute left-3 top-3 rounded-full border border-[var(--border)] bg-[var(--nav)] px-2.5 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-[var(--foreground)] backdrop-blur-sm">
              {product.category}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col px-4 pb-4 pt-3 gap-3">

          {/* Collection + name + description — grows to fill space */}
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

          {/* Watch specs */}
          {isWatch && (
            <div className="grid grid-cols-2 gap-x-2 border-t border-[var(--border)] pt-2 text-[0.62rem] text-[var(--muted)]">
              <p className="truncate">{product.caseSize || "40mm"}</p>
              <p className="truncate text-right">{product.movement || "Quartz"}</p>
              {product.strap && (
                <p className="truncate col-span-2 mt-0.5 opacity-70">{product.strap} strap</p>
              )}
            </div>
          )}

          {/* Color swatches */}
          <div className="flex items-center gap-1 min-h-[14px]">
            {Array.isArray(product.colors) && product.colors.map((color, i) => (
              <span
                key={i}
                title={color}
                className="h-2.5 w-2.5 rounded-full border border-black/10 shadow-sm"
                style={{ backgroundColor: resolveColorSwatch(color) }}
              />
            ))}
            {isWatch && product.dialColor && (
              <span
                title={`Dial: ${product.dialColor}`}
                className="h-2.5 w-2.5 rounded-full border-2 border-[var(--border)]"
                style={{ backgroundColor: resolveColorSwatch(product.dialColor) }}
              />
            )}
          </div>

          {/* Price + Add to cart — always pinned together at bottom */}
          <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
            <p className="text-[0.88rem] font-semibold text-[var(--price)]">
              {fmt(product.price)}
            </p>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={adding}
              className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-[var(--foreground)] transition hover:border-[var(--foreground)] disabled:opacity-60"
            >
              {adding ? (
                <>
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full border border-transparent border-t-[var(--foreground)] animate-spin"
                    style={{ animationDuration: "0.6s" }}
                  />
                  Adding
                </>
              ) : (
                "Add to cart"
              )}
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}