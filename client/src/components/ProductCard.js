"use client";

import Link from "next/link";
import { useAppContext } from "@/app/state/AppContext";
import { resolveColorSwatch } from "@/lib/colorSwatch";
import { resolveProductImage } from "@/lib/productImage";

export default function ProductCard({ product }) {
  const { addToCart } = useAppContext();

  function handleAddToCart(event) {
    event.preventDefault();
    event.stopPropagation();
    addToCart(product);
  }

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <article className="flex h-full flex-col overflow-hidden rounded-[1.15rem] border border-[var(--border)] bg-[var(--card)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(30,27,24,0.08)]">
        <div className="relative aspect-[1.28] w-full overflow-hidden bg-[var(--card-media)]">
          <img
            src={resolveProductImage(product)}
            alt={product.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            loading="lazy"
          />
        </div>

        <div className="flex flex-1 flex-col justify-between space-y-2 px-4 pb-4 pt-3 sm:px-3 sm:pb-2.5 sm:pt-2">
          <div className="space-y-0.5">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted)] sm:text-[0.56rem]">
              {product.collection || "Chronolite Watch"}
            </p>
            <h2 className="font-display max-w-[16ch] text-[0.88rem] font-semibold leading-[1.1] text-[var(--foreground)] sm:max-w-[13ch] sm:text-[0.76rem]">
              {product.name}
            </h2>
            <p className="line-clamp-2 text-[0.7rem] leading-5 text-[var(--muted)] sm:line-clamp-1 sm:text-[0.56rem] sm:leading-[0.8rem]">
              {product.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-2 text-[0.66rem] text-[var(--muted)] sm:gap-1 sm:pt-1 sm:text-[0.5rem]">
            <p className="truncate">{product.caseSize}</p>
            <p className="truncate text-right">{product.movement}</p>
          </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {product.colors?.map((color, i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full border border-black/10"
                style={{ backgroundColor: resolveColorSwatch(color) }}
              />
            ))}
          </div>
          <p className="text-[0.8rem] font-semibold text-[var(--price)] sm:text-[0.58rem]">
            {new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency: "NGN",
              maximumFractionDigits: 0,
            }).format(product.price)}
          </p>
          <button
            type="button"
            onClick={handleAddToCart}
            className="rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-[var(--foreground)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
          >
            Add to cart
          </button>
        </div>
        </div>
      </article>
    </Link>
  );
}
