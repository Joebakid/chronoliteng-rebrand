"use client";

import { useSearchParams } from "next/navigation";
import PageLoader from "@/components/PageLoader";
import Pagination from "@/components/Pagination";

const ORDERS_PER_PAGE = 5;

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
  const pageFromURL = parseInt(searchParams.get("page"), 10) || 1;
  const totalOrderPages = Math.max(1, Math.ceil(orders.length / ORDERS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, pageFromURL), totalOrderPages);

  const paginatedOrders = orders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE);

  if (loadingOrders) return <PageLoader text="Loading orders" />;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">All orders ({orders.length})</h2>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-[var(--border)] py-20 text-center text-sm text-[var(--muted)]">No orders found.</div>
      ) : (
        <div className="grid gap-4">
          {paginatedOrders.map((order) => (
            <div key={order.id} className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)]/50 pb-4">
                <div>
                  <p className="text-sm font-bold leading-tight">{order.userName || "Customer"}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">{order.userEmail}</p>
                  <p className="text-[10px] text-[var(--muted)] opacity-60 mt-1 uppercase">{fmtDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                  <p className="text-lg font-bold text-[var(--price)]">{fmt(order.total || 0)}</p>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${order.status === "pending" ? "bg-amber-500/10 text-amber-600" : "bg-green-500/10 text-green-600"}`}>
                    {order.status || "pending"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {(order.items || []).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-2 pr-4">
                    <img src={item.image} className="w-12 h-12 rounded-xl object-cover bg-white" alt="" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{item.name}</p>
                      <p className="text-[10px] text-[var(--muted)]">{fmt(item.price)} × {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {totalOrderPages > 1 && <Pagination totalPages={totalOrderPages} />}
        </div>
      )}
    </div>
  );
}