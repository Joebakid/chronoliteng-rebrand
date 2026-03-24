"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAppContext } from "@/app/state/AppContext";

import CartItemsList from "./CartItemsList";
import CartSummary from "./CartSummary";
import DeliveryPreview from "./DeliveryPreview";

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

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

  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [paystackLoading, setPaystackLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const paystackLoadedRef = useRef(false);

  /*
  DELIVERY FEE
  */
  const deliveryFee =
    deliveryInfo?.state?.toLowerCase() === "delta" ? 2500 : 4000;

  const finalTotal = cartTotal + deliveryFee;

  /*
  FETCH DELIVERY INFO
  */
  useEffect(() => {
    if (!user) return;

    const userId = user.id || user.uid;

    if (!userId) return;

    getDoc(doc(db, "users", userId))
      .then((snap) => {
        if (!snap.exists()) return;

        const data = snap.data();

        setDeliveryInfo({
          name: data.name || user.name || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
        });
      })
      .catch(console.error);
  }, [user]);

  /*
  LOAD PAYSTACK
  */
  const loadPaystackScript = () => {
    if (paystackLoadedRef.current) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");

      script.src = "https://js.paystack.co/v1/inline.js";

      script.onload = () => {
        paystackLoadedRef.current = true;
        resolve();
      };

      script.onerror = () =>
        reject(new Error("Unable to load Paystack"));

      document.body.appendChild(script);
    });
  };

  /*
  VERIFY PAYMENT
  */
  const verifyAndSave = async (reference) => {
    setVerifying(true);
    setCheckoutError("");

    try {
      const res = await fetch("/api/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference,
          user: {
            id: user?.id || user?.uid || user?.email,
            email: user?.email,
            name: user?.name,
          },
          delivery: deliveryInfo,
          items: cartItems,
          total: finalTotal,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Payment verification failed");
      }

      clearCart();

      router.push("/account/profile");
    } catch (err) {
      setCheckoutError(
        err.message || "Unable to verify payment. Please contact support."
      );
    } finally {
      setVerifying(false);
    }
  };

  /*
  PAYSTACK CHECKOUT
  */
  const handlePaystack = async () => {
    setCheckoutError("");

    if (!user) {
      router.push("/account/sign-in?next=/cart");
      return;
    }

    if (!deliveryInfo?.phone || !deliveryInfo?.address) {
      setCheckoutError("Please add delivery details before checkout.");
      return;
    }

    try {
      setPaystackLoading(true);

      await loadPaystackScript();

      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: Math.round(finalTotal * 100),
        currency: "NGN",
        ref: `Chronolite_${Date.now()}`,

        metadata: {
          custom_fields: [
            {
              display_name: "Customer Name",
              value: deliveryInfo.name,
            },
            {
              display_name: "Phone",
              value: deliveryInfo.phone,
            },
            {
              display_name: "Address",
              value: [
                deliveryInfo.address,
                deliveryInfo.city,
                deliveryInfo.state,
              ]
                .filter(Boolean)
                .join(", "),
            },
          ],
        },

        callback: ({ reference }) => {
          setPaystackLoading(false);
          verifyAndSave(reference);
        },

        onClose: () => setPaystackLoading(false),
      });

      handler.openIframe();
    } catch (error) {
      setCheckoutError("Unable to load Paystack");
      setPaystackLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return <p className="text-center">Your cart is empty</p>;
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <CartItemsList
        cartItems={cartItems}
        updateCartQuantity={updateCartQuantity}
        removeFromCart={removeFromCart}
      />

      <div className="space-y-4">
        <DeliveryPreview user={user} deliveryInfo={deliveryInfo} />

        {checkoutError && (
          <div className="text-sm text-red-500">{checkoutError}</div>
        )}

        <CartSummary
          cartCount={cartCount}
          cartTotal={cartTotal}
          deliveryFee={deliveryFee}
          clearCart={clearCart}
          onCheckout={handlePaystack}
          loading={paystackLoading}
        />
      </div>
    </section>
  );
}