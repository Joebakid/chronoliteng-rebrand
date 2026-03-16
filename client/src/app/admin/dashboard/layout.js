"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import BackHomeButton from "@/components/BackHomeButton";
import { useAppContext } from "@/app/state/AppContext";
import { getAdminRequests } from "@/lib/api"; // Import your fetch helper

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useAppContext();
  const [openRequestsCount, setOpenRequestsCount] = useState(0);

  const isLoginPage = pathname === "/admin/login";

  // Fetch requests to check for "open" status
  useEffect(() => {
    if (isLoginPage) return;

    const fetchCounts = async () => {
      try {
        const data = await getAdminRequests();
        // Count chats where status is "open" (waiting for admin)
        const count = data.filter((req) => req.status === "open").length;
        setOpenRequestsCount(count);
      } catch (err) {
        console.error("Failed to fetch request counts:", err);
      }
    };

    fetchCounts();
    // Optional: Set up an interval to refresh the badge every 60 seconds
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, [isLoginPage, pathname]);

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = "/admin/login";
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/admin/login";
    }
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

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
            {pathname === "/admin/requests" ? "Requests inbox" : "Product management"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className={`rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold transition ${
              pathname === "/admin/dashboard"
                ? "bg-[var(--foreground)] text-[var(--surface-strong)]"
                : "bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--background-strong)]"
            }`}
          >
            Dashboard
          </Link>
          
          <Link
            href="/admin/requests"
            className={`relative rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold transition ${
              pathname === "/admin/requests"
                ? "bg-[var(--foreground)] text-[var(--surface-strong)]"
                : "bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--background-strong)]"
            }`}
          >
            Requests
            {/* NOTIFICATION BADGE */}
            {openRequestsCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[var(--surface-strong)]">
                {openRequestsCount}
              </span>
            )}
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