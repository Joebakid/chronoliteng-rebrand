"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAppContext } from "@/app/state/AppContext";

import CartItemsList from "./CartItemsList";
import CartSummary from "./CartSummary";
import DeliveryPreview from "./DeliveryPreview";
import Link from "next/link"; // Added for Success View links

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

  const [deliveryInfo, setDeliveryInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });

  const [checkoutError, setCheckoutError] = useState("");
  const [paystackLoading, setPaystackLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // New Success State

  const paystackLoadedRef = useRef(false);

  const deliveryFee = deliveryInfo?.state?.toLowerCase() === "delta" ? 2500 : 4000;
  const finalTotal = cartTotal + deliveryFee;

  useEffect(() => {
    if (!user) return;
    const userId = user.id || user.uid;
    if (!userId) return;

    getDoc(doc(db, "users", userId))
      .then((snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        setDeliveryInfo({
          name: data.name || user.displayName || user.name || "",
          email: user.email || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
        });
      })
      .catch(console.error);
  }, [user]);

  const loadPaystackScript = () => {
    if (paystackLoadedRef.current) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.onload = () => {
        paystackLoadedRef.current = true;
        resolve();
      };
      script.onerror = () => reject(new Error("Unable to load Paystack"));
      document.body.appendChild(script);
    });
  };

  const verifyAndSave = async (reference) => {
    setVerifying(true);
    setCheckoutError("");

    try {
      const res = await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          user: user
            ? {
                id: user.id || user.uid,
                email: user.email,
                name: user.displayName || user.name,
              }
            : {
                id: `GUEST_${Date.now()}`,
                email: deliveryInfo.email,
                name: deliveryInfo.name,
              },
          delivery: deliveryInfo,
          items: cartItems,
          total: finalTotal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Payment verification failed");

      clearCart();
      setIsSuccess(true); // Trigger Success View
    } catch (err) {
      setCheckoutError(err.message || "Unable to verify payment. Please contact support.");
    } finally {
      setVerifying(false);
    }
  };

  const handlePaystack = async () => {
    setCheckoutError("");
    const emailAddress = user?.email || deliveryInfo.email;

    if (!emailAddress) {
      setCheckoutError("Please provide an email address.");
      return;
    }
    if (!deliveryInfo?.phone || !deliveryInfo?.address || !deliveryInfo?.name) {
      setCheckoutError("Please complete delivery details before checkout.");
      return;
    }

    try {
      setPaystackLoading(true);
      await loadPaystackScript();

      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: emailAddress,
        amount: Math.round(finalTotal * 100),
        currency: "NGN",
        ref: `Chrono_${Date.now()}`,
        metadata: {
          custom_fields: [
            { display_name: "Customer Name", value: deliveryInfo.name },
            { display_name: "Phone", value: deliveryInfo.phone },
            {
              display_name: "Address",
              value: [deliveryInfo.address, deliveryInfo.city, deliveryInfo.state].filter(Boolean).join(", "),
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

  // --- SUCCESS VIEW COMPONENT ---
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10 text-green-500">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter italic">Order Confirmed</h2>
        <p className="mt-4 max-w-sm text-sm text-[var(--muted)] leading-relaxed">
          Your payment was successful. We’ve received your order and are preparing it for delivery to <b>{deliveryInfo.state}</b>.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link href="/" className="rounded-full bg-[var(--inverse-bg)] px-10 py-4 text-[0.7rem] font-bold uppercase tracking-widest text-[var(--inverse-fg)] transition hover:scale-105">
            Continue Shopping
          </Link>
          {user && (
            <Link href="/account/profile" className="rounded-full border border-[var(--border)] px-10 py-4 text-[0.7rem] font-bold uppercase tracking-widest hover:bg-[var(--surface)] transition">
              View My Orders
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--muted)]">Your cart is empty</p>
        <Link href="/" className="text-xs font-bold uppercase underline underline-offset-4">Return to shop</Link>
      </div>
    );
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <CartItemsList
          cartItems={cartItems}
          updateCartQuantity={updateCartQuantity}
          removeFromCart={removeFromCart}
        />

        {!user && (
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4 shadow-sm">
            <h3 className="text-[0.7rem] font-bold uppercase tracking-widest text-[var(--muted)]">
              Delivery Details (Guest)
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Full Name"
                className="rounded-xl border border-[var(--border)] bg-transparent p-3.5 text-sm outline-none focus:border-orange-500 transition"
                value={deliveryInfo.name}
                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, name: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email Address"
                className="rounded-xl border border-[var(--border)] bg-transparent p-3.5 text-sm outline-none focus:border-orange-500 transition"
                value={deliveryInfo.email}
                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, email: e.target.value })}
              />
              <input
                type="tel"
                placeholder="Phone Number"
                className="rounded-xl border border-[var(--border)] bg-transparent p-3.5 text-sm outline-none focus:border-orange-500 transition"
                value={deliveryInfo.phone}
                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, phone: e.target.value })}
              />
              <select
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 text-sm outline-none focus:border-orange-500 transition appearance-none"
                value={deliveryInfo.state}
                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, state: e.target.value })}
              >
                <option value="">Select State</option>
                <option value="Delta">Delta</option>
                <option value="Lagos">Lagos</option>
                <option value="Abuja">Abuja</option>
                <option value="Rivers">Rivers</option>
                <option value="Other">Other States</option>
              </select>
            </div>
            <textarea
              placeholder="Full Delivery Address"
              className="w-full rounded-xl border border-[var(--border)] bg-transparent p-3.5 text-sm outline-none focus:border-orange-500 transition"
              rows="2"
              value={deliveryInfo.address}
              onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <DeliveryPreview user={user} deliveryInfo={deliveryInfo} />

        {checkoutError && (
          <div className="rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-500 animate-shake">
            {checkoutError}
          </div>
        )}

        <CartSummary
          cartCount={cartCount}
          cartTotal={cartTotal}
          deliveryFee={deliveryFee}
          clearCart={clearCart}
          onCheckout={handlePaystack}
          loading={paystackLoading || verifying}
        />
      </div>
    </section>
  );
}