"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackHomeButton from "@/components/BackHomeButton";
import PageLoader from "@/components/PageLoader"; // Import your loader
import { useAppContext } from "@/app/state/AppContext";
import { getPurchaseHistory } from "@/lib/purchaseHistory";
import { getUserRequests } from "@/lib/api";
import AccountInfo from "./components/AccountInfo";
import PurchaseHistory from "./components/PurchaseHistory";
import RequestsSection from "./components/RequestsSection";

export default function ProfilePage() {
  const router = useRouter();
  const { user, authLoading } = useAppContext(); // Get authLoading from context

  const [purchases, setPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const fetchRequests = async () => {
    if (!user) return;
    setLoadingRequests(true);
    try {
      const data = await getUserRequests(user);
      setRequests(data);
    } catch (err) {
      console.error("[ProfilePage] requests error:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    // 1. Wait for auth check to finish
    if (authLoading) return;

    // 2. If no user after check, don't fetch data
    if (!user) return;

    // 3. Admin Redirect
    if (user.isAdmin) {
      console.log("[ProfilePage] Admin detected, redirecting...");
      router.replace("/admin/dashboard");
      return;
    }

    // 4. Fetch Profile Data
    setLoadingPurchases(true);
    getPurchaseHistory(user)
      .then(setPurchases)
      .catch((err) => console.error("[ProfilePage] purchases error:", err))
      .finally(() => setLoadingPurchases(false));

    fetchRequests();
  }, [router, user, authLoading]);

  // --- LOADING STATE ---
  if (authLoading) {
    return (
      <main className="site-frame flex min-h-[60dvh] items-center justify-center">
        <PageLoader text="Verifying session..." />
      </main>
    );
  }

  // --- UNAUTHORIZED STATE ---
  if (!user) {
    return (
      <main className="site-frame flex min-h-[calc(100dvh-5.5rem)] items-center py-6 sm:py-8">
        <section className="w-full rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[var(--shadow)] sm:p-8">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Profile</p>
          <h1 className="mt-4 font-display text-3xl font-semibold text-[var(--foreground)]">Sign in to view your account</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">Your profile and purchase history are available after you sign in.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/account/sign-in?next=/account/profile" className="inline-flex items-center justify-center rounded-full bg-[var(--inverse-bg)] px-5 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[var(--inverse-fg)]">Sign in</Link>
            <Link href="/account/create-account?next=/account/profile" className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]">Create account</Link>
          </div>
        </section>
      </main>
    );
  }

  if (user.isAdmin) return null;

  // --- AUTHORIZED PROFILE VIEW ---
  return (
    <main className="site-frame py-6 sm:py-8 lg:py-10">
      <div className="mb-4 flex justify-end sm:mb-6">
        <BackHomeButton />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <AccountInfo
            user={user}
            purchases={purchases}
            requests={requests}
            loadingPurchases={loadingPurchases}
            loadingRequests={loadingRequests}
          />
          <PurchaseHistory
            purchases={purchases}
            loading={loadingPurchases}
            onLightbox={setLightboxImage}
          />
        </div>

        <RequestsSection
          user={user}
          requests={requests}
          loading={loadingRequests}
          onRefresh={fetchRequests}
          onLightbox={setLightboxImage}
        />
      </div>

      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setLightboxImage(null)}>
          <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImage} alt="Product" className="w-full rounded-2xl object-contain max-h-[80vh]" />
            <button onClick={() => setLightboxImage(null)} className="absolute -top-3 -right-3 bg-white text-black rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-lg">✕</button>
          </div>
        </div>
      )}
    </main>
  );
}