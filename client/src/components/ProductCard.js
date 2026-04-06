"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/state/AppContext";
import { resolveProductImage } from "@/lib/productImage";
import { isProductStarred, toggleStar } from "@/lib/api/stars";
import ImageWithLoader from "@/components/ImageWithLoader";

const fmt = (n) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

export default function ProductCard({
  product,
  currentPage = 1,
  selectedCategory = null,
  searchQuery = "",
}) {
  const { user, addToCart } = useAppContext();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const intervalRef = useRef(null);

  // Check if product is starred
  useEffect(() => {
    if (user?.id && product?.id) {
      isProductStarred(user.id, product.id).then(setIsStarred);
    }
  }, [user?.id, product?.id]);

  // Don't show star button if user is not logged in
  const showStarButton = !!user?.id;

  if (!product) return null;

  // Build image array — support both single and multiple
  const images = (() => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images;
    }
    const fallback = resolveProductImage(product);
    return fallback ? [fallback] : [];
  })();

  const hasMultiple = images.length > 1;

  // Auto-cycle through images on hover
  useEffect(() => {
    if (hovered && hasMultiple) {
      intervalRef.current = setInterval(() => {
        setActiveImg((prev) => (prev + 1) % images.length);
      }, 900);
    } else {
      clearInterval(intervalRef.current);
      if (!hovered) setActiveImg(0);
    }
    return () => clearInterval(intervalRef.current);
  }, [hovered, hasMultiple, images.length]);

  async function handleAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    await addToCart(product);
    setTimeout(() => setAdding(false), 800);
  }

  async function handleStar(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!user?.id) {
      router.push("/account?login=true");
      return;
    }

    try {
      const result = await toggleStar(user.id, product);
      setIsStarred(result.starred);
    } catch (err) {
      console.error("Failed to toggle star:", err);
    }
  }

  const productPath = product.id || product._id || product.slug;
  const params = new URLSearchParams();
  if (currentPage > 1) params.set("page", currentPage);
  if (selectedCategory) params.set("category", selectedCategory);
  if (searchQuery) params.set("q", searchQuery);
  const productUrl = `/product/${productPath}${params.toString() ? `?${params.toString()}` : ""}`;

  return (
    <Link href={productUrl} className="group block h-full">
      <article
        className="flex h-full flex-col overflow-hidden rounded-[1.15rem] border border-[var(--border)] bg-[var(--card)] transition duration-300 hover:-translate-y-1"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Image Container */}
        <div
          className="relative w-full overflow-hidden bg-[var(--surface-strong)]/20 p-4 flex items-center justify-center"
          style={{ height: "220px" }}
        >
          {/* Images — stack and fade between them */}
          {images.map((src, i) => (
            <div
              key={i}
              className="absolute inset-0 p-4 flex items-center justify-center transition-opacity duration-500"
              style={{ opacity: activeImg === i ? 1 : 0 }}
            >
              <ImageWithLoader
                src={src}
                alt={`${product.name} ${i + 1}`}
                className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ))}

          {/* Brand badge */}
          <span className="absolute left-3 top-3 z-20 rounded-full border border-[var(--border)] bg-[var(--nav)] px-3 py-1 text-[0.55rem] font-bold uppercase tracking-widest backdrop-blur-md">
            {product.collection || "CHRONO"}
          </span>

          {/* Star button */}
          {showStarButton && (
            <button
              onClick={handleStar}
              className={`absolute right-3 bottom-3 z-20 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                isStarred
                  ? "bg-amber-500 text-white"
                  : "bg-white/80 text-[var(--muted)] hover:bg-amber-50 hover:text-amber-500"
              }`}
            >
              {isStarred ? "★" : "☆"}
            </button>
          )}

          {/* Image count dots — only when multiple */}
          {hasMultiple && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1 z-20">
              {images.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: activeImg === i ? 16 : 5,
                    height: 5,
                    background: activeImg === i
                      ? "var(--accent)"
                      : "var(--border)",
                    opacity: activeImg === i ? 1 : 0.6,
                  }}
                />
              ))}
            </div>
          )}

          {/* Photo count badge */}
          {hasMultiple && (
            <span className="absolute right-3 top-3 z-20 rounded-full bg-black/50 px-2 py-0.5 text-[0.55rem] font-bold text-white backdrop-blur-md">
              {images.length} photos
            </span>
          )}
        </div>

        {/* Card body */}
        <div className="flex flex-1 flex-col p-4 gap-3">
          <div className="flex-1">
            <h2 className="text-[0.88rem] font-semibold line-clamp-1">
              {product.name}
            </h2>
            <p className="text-[0.68rem] text-[var(--muted)] line-clamp-2 mt-1">
              {product.description}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
            <p className="text-[0.88rem] font-bold text-[var(--price)]">
              {fmt(product.price)}
            </p>
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
