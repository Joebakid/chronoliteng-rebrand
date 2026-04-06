"use client";

import { useState, useEffect } from "react";
import { useAppContext } from "@/app/state/AppContext";
import { toggleStar, isProductStarred } from "@/lib/api/stars";
import { useRouter } from "next/navigation";

export default function StarButton({ product, size = "default" }) {
  const { user } = useAppContext();
  const router = useRouter();
  const [isStarred, setIsStarred] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id && product?.id) {
      isProductStarred(user.id, product.id).then(setIsStarred);
    }
  }, [user?.id, product?.id]);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user?.id) {
      router.push("/account?login=true");
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      const result = await toggleStar(user.id, product);
      setIsStarred(result.starred);
    } catch (err) {
      console.error("Failed to toggle star:", err);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = size === "large"
    ? "w-14 h-14 rounded-2xl"
    : "w-10 h-10 rounded-xl";

  const iconSize = size === "large" ? "text-2xl" : "text-lg";

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`${sizeClasses} flex items-center justify-center border transition-all duration-200 ${
        isStarred
          ? "bg-amber-50 border-amber-300 text-amber-500 hover:bg-amber-100"
          : "bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:border-amber-300 hover:text-amber-400"
      } ${loading ? "opacity-50" : ""}`}
      title={isStarred ? "Remove from Starred" : "Add to Starred"}
    >
      <span className={iconSize}>
        {isStarred ? "★" : "☆"}
      </span>
    </button>
  );
}
