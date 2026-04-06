"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const inputCls = "w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition";
const labelCls = "text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]";

export default function AccountInfo({ user, purchases, requests, loadingPurchases, loadingRequests }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingDelivery, setLoadingDelivery] = useState(true);
  const [savedMsg, setSavedMsg] = useState("");
  const [delivery, setDelivery] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });

  // Fetch delivery details directly from Firestore on mount
  useEffect(() => {
    if (!user?.id) return;
    setLoadingDelivery(true);
    getDoc(doc(db, "users", user.id))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setDelivery({
            name: data.name || user.name || "",
            phone: data.phone || "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoadingDelivery(false));
  }, [user?.id]);

  const setField = (key) => (e) =>
    setDelivery((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.id), {
        name: delivery.name.trim(),
        phone: delivery.phone.trim(),
        address: delivery.address.trim(),
        city: delivery.city.trim(),
        state: delivery.state.trim(),
      });
      setSavedMsg("Saved ✓");
      setEditing(false);
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (err) {
      console.error("[AccountInfo] save error:", err);
      setSavedMsg("Save failed");
      setTimeout(() => setSavedMsg(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const hasDelivery = delivery.phone || delivery.address;

  return (
    <section className="flex flex-col rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[var(--shadow)] lg:w-80 lg:flex-shrink-0">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Account</p>
        {savedMsg && (
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
            savedMsg.includes("fail")
              ? "text-red-600 bg-red-500/10 border-red-500/20"
              : "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
          }`}>
            {savedMsg}
          </span>
        )}
      </div>

      <h1 className="font-display text-2xl font-semibold text-[var(--foreground)] mb-4">{user.name}</h1>

      {/* Stats */}
      <div className="space-y-2.5 mb-5">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <p className={labelCls}>Email</p>
          <p className="mt-1.5 text-sm text-[var(--foreground)] truncate">{user.email}</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <p className={labelCls}>Purchases</p>
            <p className="mt-1.5 text-sm text-[var(--foreground)]">{loadingPurchases ? "—" : purchases.length}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <p className={labelCls}>Requests</p>
            <p className="mt-1.5 text-sm text-[var(--foreground)]">{loadingRequests ? "—" : requests.length}</p>
          </div>
        </div>

        {/* Starred Link */}
        <Link
          href="/account/starred"
          className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:border-amber-300 transition-colors group"
        >
          <div>
            <p className={labelCls}>Starred</p>
            <p className="mt-1 text-sm text-[var(--foreground)]">Your saved items</p>
          </div>
          <span className="text-xl text-amber-500 group-hover:scale-110 transition-transform">★</span>
        </Link>
      </div>

      {/* Delivery Details */}
      <div className="border-t border-[var(--border)] pt-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-[var(--muted)]">
            Delivery Details
          </p>
          {!loadingDelivery && (
            <button
              onClick={() => setEditing(!editing)}
              className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] underline"
            >
              {editing ? "Cancel" : hasDelivery ? "Edit" : "Add"}
            </button>
          )}
        </div>

        {loadingDelivery ? (
          <div className="space-y-2">
            <div className="h-10 rounded-xl bg-[var(--border)] animate-pulse" />
            <div className="h-10 rounded-xl bg-[var(--border)] animate-pulse" />
          </div>
        ) : editing ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className={labelCls}>Full Name</label>
              <input value={delivery.name} onChange={setField("name")} placeholder="Your full name" className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Phone Number</label>
              <input value={delivery.phone} onChange={setField("phone")} placeholder="e.g. 08012345678" type="tel" className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Delivery Address</label>
              <input value={delivery.address} onChange={setField("address")} placeholder="Street address" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className={labelCls}>City</label>
                <input value={delivery.city} onChange={setField("city")} placeholder="Lagos" className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>State</label>
                <input value={delivery.state} onChange={setField("state")} placeholder="Lagos State" className={inputCls} />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-full bg-[var(--foreground)] py-2.5 text-xs font-bold uppercase tracking-widest text-[var(--surface-strong)] transition active:scale-95 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Details"}
            </button>
          </div>
        ) : hasDelivery ? (
          <div className="space-y-2">
            {delivery.phone && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
                <p className={labelCls}>Phone</p>
                <p className="mt-1 text-sm text-[var(--foreground)]">{delivery.phone}</p>
              </div>
            )}
            {delivery.address && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
                <p className={labelCls}>Address</p>
                <p className="mt-1 text-sm text-[var(--foreground)]">{delivery.address}</p>
                {(delivery.city || delivery.state) && (
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    {[delivery.city, delivery.state].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] py-6 text-center">
            <p className="text-xs text-[var(--muted)]">No delivery details yet.</p>
            <p className="text-[11px] text-[var(--muted)] opacity-60 mt-1">
              Add your address to speed up checkout.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
