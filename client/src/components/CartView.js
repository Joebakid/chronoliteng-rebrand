"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/state/AppContext";
import { createOrder } from "@/lib/api";
import { resolveProductImage } from "@/lib/productImage";
import { recordPurchase } from "@/lib/purchaseHistory";
import { getStoredUserSession } from "@/lib/userAuth";

function formatPrice(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CartView() {
  const router = useRouter();
  const {
    user,
    cartItems,
    cartCount,
    cartTotal,
    removeFromCart,
    updateCartQuantity,
    clearCart,
  } = useAppContext();
  const [checkoutError, setCheckoutError] = useState("");

  async function handleCheckout() {
    setCheckoutError("");

    if (!user) {
      router.push("/account/sign-in?next=/account/profile");
      return;
    }

    const token = getStoredUserSession()?.token;
    if (!token) {
      router.push("/account/sign-in?next=/account/profile");
      return;
    }

    try {
      await createOrder(
        {
          items: cartItems,
          total: cartTotal,
        },
        token
      );
      recordPurchase(user, cartItems, cartTotal);
      clearCart();
      router.push("/account/profile");
    } catch (error) {
      setCheckoutError(error.message || "Unable to complete checkout right now.");
    }
  }

  if (cartItems.length === 0) {
    return (
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 text-center shadow-[var(--shadow)] sm:p-8">
        <p className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
          Your cart is empty
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
          Pick a watch to get started
        </h1>
        <Link
          href="/"
          className="mt-6 inline-flex min-w-[14rem] items-center justify-center whitespace-nowrap rounded-full bg-[var(--accent)] px-6 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[#120f0b]"
        >
          Continue shopping
        </Link>
      </section>
    );
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4">
        {cartItems.map((item) => (
          <article
            key={item.slug}
            className="grid gap-4 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4 shadow-[var(--shadow)] sm:grid-cols-[140px_1fr]"
          >
            <div className="relative aspect-square overflow-hidden rounded-[1rem] bg-[var(--card-media)]">
              <img
                src={resolveProductImage(item)}
                alt={item.name}
                className="h-full w-full object-contain p-4"
                loading="lazy"
              />
            </div>

            <div className="flex flex-col justify-between gap-4">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                  {item.collection}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                  {item.name}
                </h2>
                <p className="mt-2 text-[0.84rem] leading-6 text-[var(--muted)]">
                  {item.description}
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateCartQuantity(item.slug, item.quantity - 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-lg"
                  >
                    -
                  </button>
                  <span className="min-w-8 text-center text-[0.84rem] font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCartQuantity(item.slug, item.quantity + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-lg"
                  >
                    +
                  </button>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-[0.96rem] font-semibold text-[var(--price)]">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.slug)}
                    className="mt-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="h-fit rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[var(--shadow)]">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
          Cart summary
        </p>
        {checkoutError && (
          <div className="mt-4 rounded-2xl border border-[rgba(161,69,59,0.2)] bg-[rgba(161,69,59,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
            {checkoutError}
          </div>
        )}
        <div className="mt-6 space-y-3 border-b border-[var(--border)] pb-5 text-[0.84rem]">
          <div className="flex items-center justify-between">
            <span>Items</span>
            <span>{cartCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Total</span>
            <span className="font-semibold text-[var(--price)]">{formatPrice(cartTotal)}</span>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={handleCheckout}
            className="w-full rounded-full bg-[var(--foreground)] px-6 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[var(--surface-strong)]"
          >
            Proceed to checkout
          </button>
          <button
            type="button"
            onClick={clearCart}
            className="w-full rounded-full border border-[var(--border)] px-6 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]"
          >
            Clear cart
          </button>
        </div>
      </aside>
    </section>
  );
}
