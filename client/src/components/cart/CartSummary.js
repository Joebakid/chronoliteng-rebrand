"use client";

import { useState } from "react";
import { generateInstallmentSchedule } from "@/lib/installmentPayment";

function formatPrice(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function CartSummary({
  cartCount,
  cartTotal,
  deliveryFee,
  discountAmount = 0,
  clearCart,
  onCheckout,
  loading,
}) {
  const [installmentCount, setInstallmentCount] = useState(1);

  // Grand total including subtotal, delivery fee, and discounts
  const finalTotal = Math.max(0, cartTotal + deliveryFee - discountAmount);

  // Generate current active plan breakdown
  const plan = generateInstallmentSchedule(finalTotal, installmentCount);

  // Helper to calculate deposit preview for each dropdown option
  const getDepositPreview = (count) => {
    if (count === 1) return formatPrice(finalTotal);
    const tempPlan = generateInstallmentSchedule(finalTotal, count);
    return formatPrice(tempPlan.amountPaidToday);
  };

  const handleCheckoutClick = () => {
    const checkoutPlan = {
      ...plan,
      type: installmentCount > 1 ? "installment" : "full",
    };
    onCheckout(checkoutPlan);
  };

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

      {/* --- INSTALLMENT PLAN SELECTOR --- */}
      <div className="space-y-2 border-b border-[var(--border)] pb-5">
        <label className="text-[0.7rem] font-bold uppercase tracking-wider text-[var(--muted)]">
          Payment Option
        </label>
        <select
          value={installmentCount}
          onChange={(e) => setInstallmentCount(Number(e.target.value))}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
        >
          <option value={1}>Pay in Full ({formatPrice(finalTotal)})</option>
          <option value={3}>3 Payments ({getDepositPreview(3)} / 15 days)</option>
          <option value={4}>4 Payments ({getDepositPreview(4)} / 10 days)</option>
          <option value={5}>5 Payments ({getDepositPreview(5)} / 8 days)</option>
          <option value={6}>6 Payments ({getDepositPreview(6)} / 6 days)</option>
        </select>

        {installmentCount > 1 && (
          <div className="mt-2 rounded-xl bg-[var(--surface)] p-3 text-[11px] text-[var(--muted)] space-y-1">
            <p className="font-bold text-[var(--accent)]">
              Due Today: {formatPrice(plan.amountPaidToday)}
            </p>
            <p>Remaining Balance: {formatPrice(plan.balanceDue)} over 30 days</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <button
          onClick={handleCheckoutClick}
          disabled={loading}
          className="w-full rounded-full bg-[var(--foreground)] text-[var(--background)] px-6 py-4 text-[0.78rem] font-bold uppercase tracking-[0.16em] shadow-xl transition active:scale-95 disabled:opacity-50"
        >
          {loading
            ? "Processing…"
            : installmentCount > 1
            ? `Pay Deposit (${formatPrice(plan.amountPaidToday)})`
            : "Pay with Paystack"}
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