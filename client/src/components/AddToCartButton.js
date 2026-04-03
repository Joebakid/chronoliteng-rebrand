"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppContext } from "@/app/state/AppContext";

export default function AddToCartButton({ product, selectedImage }) {
  const router = useRouter();
  const { addToCart } = useAppContext();
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    // Pass the currently viewed gallery image so the cart
    // shows the exact variant the customer was looking at
    addToCart({ ...product, selectedImage: selectedImage || null });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handleAddToCart}
        className="rounded-full bg-[var(--foreground)] px-7 py-3 text-[0.82rem] font-semibold uppercase tracking-[0.14em] text-[var(--surface-strong)]"
      >
        {added ? "Added to Cart ✓" : "Add to Cart"}
      </button>
      <button
        type="button"
        onClick={() => router.push("/cart")}
        className="rounded-full border border-[var(--border)] px-7 py-3 text-[0.82rem] font-semibold uppercase tracking-[0.14em] text-[var(--foreground)]"
      >
        View Cart
      </button>
    </div>
  );
}