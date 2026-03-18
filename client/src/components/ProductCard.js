"use client";
import Link from "next/link";
import { useState } from "react";
import { useAppContext } from "@/app/state/AppContext";
import { resolveProductImage } from "@/lib/productImage";
import ImageWithLoader from "@/components/ImageWithLoader";

const fmt = (n) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

export default function ProductCard({ product }) {
  const { addToCart } = useAppContext();
  const [adding, setAdding] = useState(false);

  if (!product) return null;

  async function handleAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    await addToCart(product);
    setTimeout(() => setAdding(false), 800);
  }

  const imageSrc = resolveProductImage(product);
  const productPath = product.id || product._id || product.slug;

  return (
    <Link href={`/product/${productPath}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-[1.15rem] border border-[var(--border)] bg-[var(--card)] transition duration-300 hover:-translate-y-1">
        
        {/* Aspect Ratio Container */}
        <div className="relative aspect-[1.28] w-full overflow-hidden">
          <ImageWithLoader
            src={imageSrc}
            alt={product.name}
            className="h-full w-full"
          />
          
          <span className="absolute left-3 top-3 z-20 rounded-full border border-[var(--border)] bg-[var(--nav)] px-3 py-1 text-[0.55rem] font-bold uppercase tracking-widest backdrop-blur-md">
            {product.collection || "CHRONO"}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-4 gap-3">
          <div className="flex-1">
            <h2 className="text-[0.88rem] font-semibold line-clamp-1">{product.name}</h2>
            <p className="text-[0.68rem] text-[var(--muted)] line-clamp-2 mt-1">{product.description}</p>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
            <p className="text-[0.88rem] font-bold text-[var(--price)]">{fmt(product.price)}</p>
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-1.5 text-[0.6rem] font-bold uppercase hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
            >
              {adding ? "..." : "Add To Cart"}
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}