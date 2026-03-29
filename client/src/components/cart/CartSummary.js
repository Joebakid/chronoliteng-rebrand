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
  discountAmount = 0, // Added this prop
  clearCart,
  onCheckout,
  loading,
}) {
  // Subtract the discount from the total
  const finalTotal = cartTotal + deliveryFee - discountAmount;

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

        {/* --- SHOW DISCOUNT IF IT EXISTS --- */}
        {discountAmount > 0 && (
          <div className="flex items-center justify-between text-emerald-500 font-bold">
            <span>Discount</span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span>Delivery</span>
          <span>{formatPrice(deliveryFee)}</span>
        </div>

        <div className="flex items-center justify-between font-black text-lg text-[var(--accent)] pt-2">
          <span className="uppercase tracking-tighter text-xs text-[var(--foreground)]">Total</span>
          <span>{formatPrice(finalTotal)}</span>
        </div>

      </div>

      <div className="space-y-3">
        <button
          onClick={onCheckout}
          disabled={loading}
          className="w-full rounded-full bg-[var(--foreground)] text-[var(--background)] px-6 py-4 text-[0.78rem] font-bold uppercase tracking-[0.16em] shadow-xl transition active:scale-95 disabled:opacity-50"
        >
          {loading ? "Processing…" : "Pay with Paystack"}
        </button>

        <button
          onClick={clearCart}
          className="w-full rounded-full border border-[var(--border)] px-6 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted)] hover:text-red-500 transition"
        >
          Clear cart
        </button>
      </div>

    </aside>
  );
}