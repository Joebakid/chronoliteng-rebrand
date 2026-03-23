"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAppContext } from "@/app/state/AppContext";
import { resolveProductImage } from "@/lib/productImage";

function formatPrice(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

export default function CartView() {
  const router = useRouter();
  const { user, cartItems, cartCount, cartTotal, removeFromCart, updateCartQuantity, clearCart } = useAppContext();
  const [checkoutError, setCheckoutError] = useState("");
  const [paystackError, setPaystackError] = useState("");
  const [paystackLoading, setPaystackLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const paystackLoadedRef = useRef(false);

  // Fetch latest delivery info from Firestore when component mounts
  useEffect(() => {
    if (!user) return;
    const userId = user.id || user.uid;
    if (!userId) return;

    getDoc(doc(db, "users", userId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setDeliveryInfo({
          name: data.name || user.name || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
        });
      }
    }).catch(console.error);
  }, [user]);

  const loadPaystackScript = () => {
    if (paystackLoadedRef.current) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.onload = () => { paystackLoadedRef.current = true; resolve(); };
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
          user: {
            id: user?.id || user?.uid || user?.email,
            email: user?.email,
            name: user?.name,
          },
          delivery: deliveryInfo,
          items: cartItems,
          total: cartTotal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Payment verification failed");
      }

      clearCart();
      router.push("/account/profile");
    } catch (err) {
      setCheckoutError(err.message || "Unable to verify payment. Please contact support.");
    } finally {
      setVerifying(false);
    }
  };

  const handlePaystack = async () => {
    setPaystackError("");
    setCheckoutError("");
    if (!user) { router.push("/account/sign-in?next=/cart"); return; }

    // Warn if no delivery info
    if (!deliveryInfo?.phone || !deliveryInfo?.address) {
      setCheckoutError("Please add your phone number and delivery address in your profile before checking out.");
      return;
    }

    try {
      setPaystackLoading(true);
      await loadPaystackScript();
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: Math.round(cartTotal * 100),
        currency: "NGN",
        ref: `Chronolite_${Date.now()}`,
        metadata: {
          custom_fields: [
            { display_name: "Customer Name", variable_name: "customer_name", value: deliveryInfo?.name || user.name || "" },
            { display_name: "Phone", variable_name: "phone", value: deliveryInfo?.phone || "" },
            { display_name: "Address", variable_name: "address", value: [deliveryInfo?.address, deliveryInfo?.city, deliveryInfo?.state].filter(Boolean).join(", ") },
          ],
        },
        onClose: () => { setPaystackLoading(false); },
        callback: ({ reference }) => {
          setPaystackLoading(false);
          verifyAndSave(reference);
        },
      });
      handler.openIframe();
    } catch (error) {
      setPaystackLoading(false);
      setPaystackError(error.message || "Unable to load Paystack right now.");
    }
  };

  useEffect(() => {
    return () => { window.PaystackPop?.close?.(); };
  }, []);

  const hasDelivery = deliveryInfo?.phone && deliveryInfo?.address;

  if (cartItems.length === 0) {
    return (
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 text-center shadow-[var(--shadow)] sm:p-8">
        <p className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Your cart is empty</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">Pick a watch to get started</h1>
        <Link href="/" className="mt-6 inline-flex min-w-[14rem] items-center justify-center whitespace-nowrap rounded-full bg-[var(--accent)] px-6 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[#120f0b]">
          Continue shopping
        </Link>
      </section>
    );
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      {/* Cart items */}
      <div className="space-y-4">
        {cartItems.map((item) => (
          <article key={item.slug} className="grid gap-4 rounded-[1.5rem] bg-[var(--surface-strong)] p-4 shadow-[var(--shadow)] sm:grid-cols-[140px_1fr]">
            <div className="relative aspect-square overflow-hidden rounded-[1rem]">
              <img src={resolveProductImage(item)} alt={item.name} className="h-full w-full object-contain p-4" loading="lazy" />
            </div>
            <div className="flex flex-col justify-between gap-4">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">{item.collection}</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">{item.name}</h2>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => updateCartQuantity(item.slug, item.quantity - 1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-lg">-</button>
                  <span className="min-w-8 text-center text-[0.84rem] font-semibold">{item.quantity}</span>
                  <button type="button" onClick={() => updateCartQuantity(item.slug, item.quantity + 1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-lg">+</button>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[0.96rem] font-semibold text-[var(--price)]">{formatPrice(item.price * item.quantity)}</p>
                  <button type="button" onClick={() => removeFromCart(item.slug)} className="mt-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Remove</button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Summary sidebar */}
      <aside className="h-fit rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[var(--shadow)] space-y-5">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Cart summary</p>

        {/* Delivery info preview */}
        {user && (
          <div className={`rounded-2xl border px-4 py-3 ${hasDelivery ? "border-emerald-500/20 bg-emerald-500/5" : "border-amber-500/20 bg-amber-500/5"}`}>
            <p className="text-[10px] font-black uppercase tracking-wider mb-1.5 ${hasDelivery ? 'text-emerald-600' : 'text-amber-600'}">
              {hasDelivery ? "✓ Delivering to" : "⚠ No delivery details"}
            </p>
            {hasDelivery ? (
              <>
                <p className="text-xs font-bold text-[var(--foreground)]">{deliveryInfo.name}</p>
                <p className="text-[11px] text-[var(--muted)]">{deliveryInfo.phone}</p>
                <p className="text-[11px] text-[var(--muted)]">
                  {[deliveryInfo.address, deliveryInfo.city, deliveryInfo.state].filter(Boolean).join(", ")}
                </p>
              </>
            ) : (
              <Link href="/account/profile" className="text-[11px] text-amber-600 underline font-semibold">
                Add delivery details in your profile →
              </Link>
            )}
          </div>
        )}

        {checkoutError && (
          <div className="rounded-2xl border border-[rgba(161,69,59,0.2)] bg-[rgba(161,69,59,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
            {checkoutError}
          </div>
        )}

        {verifying && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600 font-medium">
            ✓ Verifying payment with Paystack...
          </div>
        )}

        <div className="space-y-3 border-b border-[var(--border)] pb-5 text-[0.84rem]">
          <div className="flex items-center justify-between"><span>Items</span><span>{cartCount}</span></div>
          <div className="flex items-center justify-between"><span>Total</span><span className="font-semibold text-[var(--price)]">{formatPrice(cartTotal)}</span></div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handlePaystack}
            disabled={paystackLoading || verifying}
            className="w-full rounded-full border border-[var(--border)] px-6 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] disabled:opacity-50"
          >
            {paystackLoading ? "Loading Paystack…" : verifying ? "Verifying…" : "Pay with Paystack"}
          </button>

          {paystackError && <p className="mt-1 text-xs text-[var(--danger)]">{paystackError}</p>}

          <button
            type="button"
            onClick={clearCart}
            disabled={verifying}
            className="w-full rounded-full border border-[var(--border)] px-6 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] disabled:opacity-50"
          >
            Clear cart
          </button>
        </div>
      </aside>
    </section>
  );
}