import { useState, useRef } from "react";

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

export default function usePaystackCheckout(user, cartItems, deliveryInfo) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const paystackLoadedRef = useRef(false);

  const loadPaystack = () => {
    if (paystackLoadedRef.current) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.onload = () => {
        paystackLoadedRef.current = true;
        resolve();
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  const checkout = async (plan) => {
    try {
      setLoading(true);
      await loadPaystack();

      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: plan.amountPaidToday * 100, // Charge only today's due amount
        currency: "NGN",
        ref: `Chronolite_${Date.now()}`,
        metadata: {
          paymentType: plan.type,
          totalInstallments: plan.totalInstallments,
        },
        callback: ({ reference }) => {
          fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reference,
              items: cartItems,
              user,
              delivery: deliveryInfo,
              plan,
            }),
          });
        },
      });

      handler.openIframe();
    } catch (err) {
      setError("Unable to load Paystack");
    } finally {
      setLoading(false);
    }
  };

  return { checkout, loading, error };
}