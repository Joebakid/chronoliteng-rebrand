import { useState, useRef } from "react";

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

export default function usePaystackCheckout(cartTotal, user, cartItems, deliveryInfo) {
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

  const checkout = async () => {
    try {
      setLoading(true);
      await loadPaystack();

      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: cartTotal * 100,
        currency: "NGN",
        ref: `Chronolite_${Date.now()}`,
        callback: ({ reference }) => {
          fetch("/api/verify-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              reference,
              items: cartItems,
              user,
              delivery: deliveryInfo,
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