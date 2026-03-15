"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import BackHomeButton from "@/components/BackHomeButton";
import { useAppContext } from "@/app/state/AppContext";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { signOut } = useAppContext();

  const handleLogout = async () => {
    await signOut();
    router.push("/admin/login");
  };

  return (
    <div className="site-frame flex min-h-[calc(100dvh-5.5rem)] flex-col py-4 sm:py-8 lg:py-10">
      <div className="mb-4 flex justify-end sm:mb-6">
        <BackHomeButton />
      </div>

      <div className="flex flex-col gap-4 rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4 shadow-[var(--shadow)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
            Admin Dashboard
          </p>
          <h1 className="font-display mt-2 text-2xl font-semibold text-[var(--foreground)]">
            Product management
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/requests"
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background-strong)]"
          >
            Requests
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background-strong)]"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 pt-6 sm:pt-8">{children}</div>
    </div>
  );
}