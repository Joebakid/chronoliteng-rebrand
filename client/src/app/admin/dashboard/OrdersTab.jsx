"use client";

import { useSearchParams } from "next/navigation";
import PageLoader from "@/components/PageLoader";
import Pagination from "@/components/Pagination";

const ORDERS_PER_PAGE = 3;

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

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

function getMonthStats(orders = [], year, month) {
  const filtered = orders.filter((o) => {
    const d = new Date(o.createdAt);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  return {
    count: filtered.length,
    revenue: filtered.reduce((s, o) => s + (o.total || 0), 0),
    orders: filtered,
  };
}

export default function OrdersTab({ orders = [], loadingOrders }) {
  const searchParams = useSearchParams();
  const pageFromURL = parseInt(searchParams.get("page"), 10) || 1;
  const totalOrderPages = Math.max(1, Math.ceil(orders.length / ORDERS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, pageFromURL), totalOrderPages);
  const paginatedOrders = orders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );

  const now = new Date();
  const thisMonthStats = getMonthStats(orders, now.getFullYear(), now.getMonth());
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStats = getMonthStats(orders, prevDate.getFullYear(), prevDate.getMonth());

  const revenueChange =
    lastMonthStats.revenue > 0
      ? (((thisMonthStats.revenue - lastMonthStats.revenue) / lastMonthStats.revenue) * 100).toFixed(1)
      : null;
  const ordersChange =
    lastMonthStats.count > 0
      ? (((thisMonthStats.count - lastMonthStats.count) / lastMonthStats.count) * 100).toFixed(1)
      : null;

  const revenueUp = revenueChange !== null && parseFloat(revenueChange) >= 0;
  const ordersUp = ordersChange !== null && parseFloat(ordersChange) >= 0;
  const thisMonthLabel = MONTH_NAMES[now.getMonth()];

  if (loadingOrders) return <PageLoader text="Loading orders" />;

  return (
    <div className="w-full space-y-8">

      {/* ── This Month Summary ── */}
      <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[var(--muted)]">Monthly Breakdown</p>
            <p className="text-sm font-bold mt-0.5">{thisMonthLabel}</p>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]">
            {thisMonthStats.count} order{thisMonthStats.count !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="grid grid-cols-2 divide-x divide-[var(--border)]">
          <div className="p-4 sm:p-5 space-y-2">
            <p className="text-[9px] uppercase tracking-widest font-bold text-[var(--muted)]">Revenue</p>
            <p className="text-xl sm:text-2xl font-black tabular-nums">{fmt(thisMonthStats.revenue)}</p>
            {revenueChange !== null ? (
              <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${revenueUp ? "text-emerald-600" : "text-red-500"}`}>
                {revenueUp ? "▲" : "▼"} {revenueUp ? "+" : ""}{revenueChange}% vs last month
              </span>
            ) : (
              <span className="text-[10px] text-[var(--muted)]">No prior month data</span>
            )}
          </div>

          <div className="p-4 sm:p-5 space-y-2">
            <p className="text-[9px] uppercase tracking-widest font-bold text-[var(--muted)]">Orders</p>
            <p className="text-xl sm:text-2xl font-black tabular-nums">{thisMonthStats.count}</p>
            {ordersChange !== null ? (
              <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${ordersUp ? "text-emerald-600" : "text-red-500"}`}>
                {ordersUp ? "▲" : "▼"} {ordersUp ? "+" : ""}{ordersChange}% vs last month
              </span>
            ) : (
              <span className="text-[10px] text-[var(--muted)]">No prior month data</span>
            )}
          </div>
        </div>

        {thisMonthStats.orders.length > 0 && (
          <div className="border-t border-[var(--border)] px-5 py-3 space-y-2">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[var(--muted)] mb-3">
              Orders this month
            </p>
            {thisMonthStats.orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--surface)] px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{order.userName || "Customer"}</p>
                  <p className="text-[10px] text-[var(--muted)] truncate">{fmtDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${order.status === "pending" ? "bg-amber-500/10 text-amber-600" : "bg-green-500/10 text-green-600"}`}>
                    {order.status || "pending"}
                  </span>
                  <p className="text-xs font-black text-[var(--accent)]">{fmt(order.total || 0)}</p>
                </div>
              </div>
            ))}
            {thisMonthStats.orders.length > 5 && (
              <p className="text-[10px] text-center text-[var(--muted)] pt-1">
                +{thisMonthStats.orders.length - 5} more — see all orders below
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── All Orders ── */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          All orders ({orders.length})
        </h2>

        {orders.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[var(--border)] py-20 text-center text-sm text-[var(--muted)]">
            No orders found.
          </div>
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
    </div>
  );
}