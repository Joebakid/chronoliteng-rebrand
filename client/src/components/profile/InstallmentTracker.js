"use client";

import { useState, useRef } from "react";

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);

export default function InstallmentTracker({ orders = [], onPaymentSuccess }) {
  const [loadingOrderId, setLoadingOrderId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const paystackLoadedRef = useRef(false);

  // ONLY show active/uncompleted installment plans
  const installmentOrders = orders.filter(
    (order) =>
      order.paymentType === "installment" &&
      order.paymentStatus !== "fully_paid" &&
      (order.balanceDue || 0) > 0
  );

  const loadPaystackScript = () => {
    if (paystackLoadedRef.current && window.PaystackPop) return Promise.resolve();

    return new Promise((resolve, reject) => {
      if (window.PaystackPop) {
        paystackLoadedRef.current = true;
        return resolve();
      }
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.onload = () => {
        paystackLoadedRef.current = true;
        resolve();
      };
      script.onerror = () => reject(new Error("Unable to load Paystack SDK"));
      document.body.appendChild(script);
    });
  };

  const processVerification = async (reference, order, payFullBalance, installmentNumber) => {
    try {
      const res = await fetch("/api/verify-installment-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          reference,
          payFullBalance,
          installmentNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Payment verification failed");
      }

      if (onPaymentSuccess) onPaymentSuccess();
    } catch (err) {
      console.error("[InstallmentTracker] Verify Error:", err);
      setErrorMsg(err.message || "Payment verification failed");
    } finally {
      setLoadingOrderId(null);
    }
  };

  const handlePayInstallment = async ({ order, amountToPay, payFullBalance, installmentNumber }) => {
    setErrorMsg("");
    setLoadingOrderId(order.id);

    const customerEmail =
      order.userEmail ||
      order.email ||
      order.delivery?.email ||
      order.user?.email ||
      "";

    if (!customerEmail) {
      setErrorMsg("Customer email is missing for this order.");
      setLoadingOrderId(null);
      return;
    }

    const numAmount = Number(amountToPay);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg("Invalid payment amount.");
      setLoadingOrderId(null);
      return;
    }

    try {
      await loadPaystackScript();

      if (!window.PaystackPop) {
        throw new Error("Paystack SDK failed to initialize.");
      }

      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: customerEmail,
        amount: Math.round(numAmount * 100),
        currency: "NGN",
        ref: `Chrono_Bal_${Date.now()}`,
        metadata: {
          orderId: order.id,
          payFullBalance,
          installmentNumber,
        },
        callback: function (response) {
          const ref = response.reference || response.trxref;
          processVerification(ref, order, payFullBalance, installmentNumber);
        },
        onClose: function () {
          setLoadingOrderId(null);
        },
      });

      handler.openIframe();
    } catch (err) {
      console.error("[InstallmentTracker] Paystack Launch Error:", err);
      setErrorMsg(err.message || "Unable to open Paystack payment window.");
      setLoadingOrderId(null);
    }
  };

  if (installmentOrders.length === 0) return null;

  return (
    <div className="space-y-3 w-full min-w-0">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
          Active Payment Plans ({installmentOrders.length})
        </h3>
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-red-500/10 p-2.5 text-[11px] font-medium text-red-500 border border-red-500/20">
          {errorMsg}
        </div>
      )}

      {installmentOrders.map((order) => {
        const plan = order.installmentPlan || {};
        const schedule = plan.schedule || [];
        const nextInstallment = schedule.find((s) => s.status !== "paid");
        const totalCost = order.totalAmount || order.total || 0;

        return (
          <div
            key={order.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4 shadow-sm space-y-3 min-w-0"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border)]/60 pb-2.5">
              <div className="min-w-0">
                <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-[var(--muted)] truncate">
                  #{order.id?.slice(-8)}
                </p>
                <p className="text-xs sm:text-sm font-black text-[var(--foreground)] mt-0.5">
                  Total: {formatPrice(totalCost)}
                </p>
              </div>

              <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0 bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                In Progress
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-[var(--surface-strong)]/50 p-2 text-[10px] sm:text-xs">
              <div>
                <p className="text-[8px] sm:text-[9px] font-bold uppercase text-[var(--muted)]">Paid</p>
                <p className="font-bold text-emerald-500 truncate">{formatPrice(order.amountPaid || 0)}</p>
              </div>
              <div>
                <p className="text-[8px] sm:text-[9px] font-bold uppercase text-[var(--muted)]">Balance</p>
                <p className="font-bold text-[var(--accent)] truncate">{formatPrice(order.balanceDue || 0)}</p>
              </div>
              <div>
                <p className="text-[8px] sm:text-[9px] font-bold uppercase text-[var(--muted)]">Progress</p>
                <p className="font-bold text-[var(--foreground)] truncate">
                  {plan.completedInstallments || 0}/{plan.totalInstallments || schedule.length}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-1">
              <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--muted)] px-0.5">
                Timeline
              </p>
              <div className="divide-y divide-[var(--border)]/40 rounded-lg border border-[var(--border)]/60 bg-[var(--surface-strong)]/30 overflow-hidden text-[11px]">
                {schedule.map((item) => {
                  const isPaid = item.status === "paid";
                  return (
                    <div
                      key={item.installment}
                      className="flex items-center justify-between px-2.5 py-1.5 text-[10px] sm:text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold ${
                            isPaid
                              ? "bg-emerald-500 text-black"
                              : "bg-[var(--border)] text-[var(--muted)]"
                          }`}
                        >
                          {isPaid ? "✓" : item.installment}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--foreground)] truncate leading-tight">
                            Payment #{item.installment}
                          </p>
                          <p className="text-[8px] sm:text-[9px] text-[var(--muted)] truncate">
                            {isPaid
                              ? `Paid ${new Date(item.paidAt).toLocaleDateString()}`
                              : `Due ${new Date(item.dueDate).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <p className="font-bold text-[var(--foreground)]">{formatPrice(item.amount)}</p>
                        <span
                          className={`text-[8px] font-bold uppercase ${
                            isPaid ? "text-emerald-500" : "text-[var(--accent)]"
                          }`}
                        >
                          {isPaid ? "Paid" : "Pending"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            {nextInstallment && (
              <div className="pt-1 flex flex-col xs:flex-row gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handlePayInstallment({
                      order,
                      amountToPay: nextInstallment.amount,
                      payFullBalance: false,
                      installmentNumber: nextInstallment.installment,
                    })
                  }
                  disabled={loadingOrderId === order.id}
                  className="flex-1 rounded-lg bg-[var(--foreground)] text-[var(--background)] py-2 px-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition active:scale-[0.98] disabled:opacity-50 shadow-sm truncate"
                >
                  {loadingOrderId === order.id
                    ? "Processing..."
                    : `Pay Next (${formatPrice(nextInstallment.amount)})`}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handlePayInstallment({
                      order,
                      amountToPay: order.balanceDue,
                      payFullBalance: true,
                      installmentNumber: null,
                    })
                  }
                  disabled={loadingOrderId === order.id}
                  className="flex-1 rounded-lg border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/10 py-2 px-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition active:scale-[0.98] disabled:opacity-50 truncate"
                >
                  Clear Balance ({formatPrice(order.balanceDue)})
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}