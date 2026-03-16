"use client";

import { useSearchParams } from "next/navigation";
import PageLoader from "@/components/PageLoader";
import Pagination from "@/components/Pagination";

const ORDERS_PER_PAGE = 4;

const fmt = (n) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

const fmtDate = (value) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export default function OrdersTab({ orders = [], loadingOrders }) {
  const searchParams = useSearchParams();

  // Read page from URL
  const pageStr = searchParams.get("page");
  const pageFromURL = parseInt(pageStr, 10) || 1;

  // Calculate total pages safely
  const totalOrderPages = Math.max(1, Math.ceil(orders.length / ORDERS_PER_PAGE));

  // Clamp page inside valid range
  const currentPage = Math.min(Math.max(1, pageFromURL), totalOrderPages);

  // Pagination slice
  const start = (currentPage - 1) * ORDERS_PER_PAGE;
  const end = start + ORDERS_PER_PAGE;
  const paginatedOrders = orders.slice(start, end);

  if (loadingOrders) return <PageLoader text="Loading orders" />;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          All orders ({orders.length})
        </h2>

        <span className="text-[10px] text-[var(--muted)] opacity-50">
          Page {currentPage} of {totalOrderPages}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] px-5 py-10 text-center text-sm text-[var(--muted)]">
          No orders yet.
        </div>
      ) : (
        <>
          {/* Orders List */}
          <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] overflow-hidden bg-black/10">
            {paginatedOrders.map((order) => (
              <div key={order.id} className="p-4 hover:bg-white/[0.02] transition">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  
                  <div>
                    <p className="text-sm font-semibold">
                      {order.userName || "—"}
                    </p>

                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      {order.userEmail || "—"}
                    </p>

                    <p className="text-xs text-[var(--muted)] opacity-60 mt-0.5">
                      {fmtDate(order.createdAt)}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-orange-500">
                      {fmt(order.total || 0)}
                    </p>

                    <div className="mt-1 flex items-center gap-1.5 justify-end">
                      <span
                        className={`text-[0.6rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                          order.status === "pending"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-green-500/10 text-green-500"
                        }`}
                      >
                        {order.status || "pending"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mt-3 space-y-2">
                  {(order.items || []).map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-white/5" />
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium truncate">
                          {item.name}
                        </p>

                        <p className="text-[10px] text-[var(--muted)]">
                          {fmt(item.price || 0)} × {item.quantity}
                        </p>
                      </div>

                      <p className="text-[11px] font-bold">
                        {fmt((item.price || 0) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalOrderPages > 1 && (
            <Pagination
              totalPages={totalOrderPages}
              currentPage={currentPage}
            />
          )}
        </>
      )}
    </div>
  );
}