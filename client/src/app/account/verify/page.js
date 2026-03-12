"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

function VerifyContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState({ loading: true, message: "", error: "" });

  useEffect(() => {
    let isMounted = true;
    async function doVerify() {
      const token = searchParams.get("token");
      if (!token) {
        if (isMounted) setStatus({ loading: false, error: "Verification token missing.", message: "" });
        return;
      }
      try {
        const payload = await apiFetch(`/auth/verify?token=${encodeURIComponent(token)}`);
        if (isMounted) setStatus({ loading: false, message: payload?.message || "Email verified. You can now sign in.", error: "" });
      } catch (error) {
        if (isMounted) setStatus({ loading: false, error: error.message || "Unable to verify email right now.", message: "" });
      }
    }
    doVerify();
    return () => { isMounted = false; };
  }, [searchParams]);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-lg rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 text-center shadow-[var(--shadow)]">
        <p className="text-xl font-semibold text-[var(--foreground)]">Email verification</p>
        {status.loading && <p className="mt-4 text-sm text-[var(--muted)]">Verifying your account...</p>}
        {status.message && (
          <p className="mt-4 rounded-2xl border border-[rgba(0,0,0,0.15)] bg-[var(--surface)] p-3 text-sm font-semibold text-[var(--foreground)]">
            {status.message}
          </p>
        )}
        {status.error && (
          <p className="mt-4 rounded-2xl border border-[rgba(161,69,59,0.2)] bg-[rgba(161,69,59,0.1)] p-3 text-sm text-[var(--danger)]">
            {status.error}
          </p>
        )}
      </div>
    </main>
  );
}

export default function VerifyAccountPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-[100dvh] items-center justify-center">
        <p className="text-sm text-[var(--muted)]">Loading...</p>
      </main>
    }>
      <VerifyContent />
    </Suspense>
  );
}