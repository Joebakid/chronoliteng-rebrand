"use client";

function formatPrice(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CartSummary({
  cartCount,
  cartTotal,
  deliveryFee,
  clearCart,
  onCheckout,
  loading,
}) {
  const finalTotal = cartTotal + deliveryFee;

  return (
    <aside className="h-fit rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[var(--shadow)] space-y-5">

      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
        Cart summary
      </p>

      <div className="space-y-3 border-b border-[var(--border)] pb-5 text-[0.84rem]">

        <div className="flex items-center justify-between">
          <span>Items</span>
          <span>{cartCount}</span>
        </div>

        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span>{formatPrice(cartTotal)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span>Delivery</span>
          <span>{formatPrice(deliveryFee)}</span>
        </div>

        <div className="flex items-center justify-between font-semibold text-[var(--price)]">
          <span>Total</span>
          <span>{formatPrice(finalTotal)}</span>
        </div>

      </div>

      <div className="space-y-3">

        <button
          onClick={onCheckout}
          disabled={loading}
          className="w-full rounded-full border border-[var(--border)] px-6 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.16em] disabled:opacity-50"
        >
          {loading ? "Loading Paystack…" : "Pay with Paystack"}
        </button>

        <button
          onClick={clearCart}
          className="w-full rounded-full border border-[var(--border)] px-6 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.16em]"
        >
          Clear cart
        </button>

      </div>

    </aside>
  );
}