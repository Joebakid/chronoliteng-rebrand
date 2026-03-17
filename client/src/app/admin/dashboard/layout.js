"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiOutlineViewGrid, HiOutlineInbox } from "react-icons/hi";
import BackHomeButton from "@/components/BackHomeButton"; // Ensure this path is correct
import { getAdminRequests } from "@/lib/api";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [openRequestsCount, setOpenRequestsCount] = useState(0);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;

    const fetchCounts = async () => {
      try {
        const data = await getAdminRequests();
        const count = data.filter((req) => req.status === "open").length;
        setOpenRequestsCount(count);
      } catch (err) {
        console.error("Failed to fetch request counts:", err);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, [isLoginPage, pathname]);

  if (isLoginPage) {
    return (
      <div className="flex min-h-[calc(100dvh-10rem)] items-center justify-center py-10">
        {children}
      </div>
    );
  }

  return (
    <div className="site-frame flex min-h-[calc(100dvh-5.5rem)] flex-col py-4 sm:py-8 lg:py-10">
      
      {/* 1. Back Button using React Icons (Now Visible) */}
      <div className="mb-4 flex justify-end sm:mb-6">
        <BackHomeButton />
      </div>

      {/* 2. Admin Toolbar (Logout REMOVED) */}
      <div className="flex flex-col gap-4 rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4 shadow-[var(--shadow)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[var(--muted)]">
            Admin Dashboard
          </p>
          <h1 className="font-display mt-2 text-2xl font-semibold text-[var(--foreground)]">
            {pathname === "/admin/requests" ? "Requests inbox" : "Product management"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Dashboard Nav */}
          <Link
            href="/admin/dashboard"
            className={`flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
              pathname === "/admin/dashboard"
                ? "bg-[var(--foreground)] text-[var(--surface-strong)]"
                : "bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--background-strong)]"
            }`}
          >
            <HiOutlineViewGrid className="text-base" />
            <span className="hidden md:inline">Dashboard</span>
          </Link>
          
          {/* Requests Nav */}
          <Link
            href="/admin/requests"
            className={`relative flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
              pathname === "/admin/requests"
                ? "bg-[var(--foreground)] text-[var(--surface-strong)]"
                : "bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--background-strong)]"
            }`}
          >
            <HiOutlineInbox className="text-base" />
            <span className="hidden md:inline">Requests</span>
            {openRequestsCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[var(--surface-strong)] animate-pulse">
                {openRequestsCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="flex-1 pt-6 sm:pt-8">
        {children}
      </div>
    </div>
  );
}