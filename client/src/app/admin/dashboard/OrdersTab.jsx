"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import PageLoader from "@/components/PageLoader";
import Pagination from "@/components/Pagination";
import { Suspense } from "react";

const ORDERS_PER_PAGE = 5;

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

function DeliveryTab({ orders }) {
  const [page, setPage] = useState(1);
  const ordersWithDelivery = orders.filter(
    (o) => o.delivery?.phone || o.delivery?.address
  );

  const totalPages = Math.max(1, Math.ceil(ordersWithDelivery.length / ORDERS_PER_PAGE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paginated = ordersWithDelivery.slice(
    (safePage - 1) * ORDERS_PER_PAGE,
    safePage * ORDERS_PER_PAGE
  );
  const goTo = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  if (ordersWithDelivery.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-[var(--border)] py-20 text-center space-y-2">
        <p className="text-2xl">🚚</p>
        <p className="text-sm text-[var(--muted)]">No delivery details yet.</p>
        <p className="text-[11px] text-[var(--muted)] opacity-60">
          Delivery info will appear here once customers add it to their profile.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
        Delivery Info ({ordersWithDelivery.length} orders)
      </p>

      {paginated.map((order) => (
        <div key={order.id} className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-sm space-y-3">
          {/* Order header */}
          <div className="flex items-start justify-between gap-3 border-b border-[var(--border)]/50 pb-3">
            <div>
              <p className="text-sm font-bold">{order.userName || "Customer"}</p>
              <p className="text-xs text-[var(--muted)]">{order.userEmail}</p>
              <p className="text-[10px] text-[var(--muted)] opacity-60 mt-1 uppercase">{fmtDate(order.createdAt)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-[var(--price)]">{fmt(order.total || 0)}</p>
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                order.status === "paid" ? "bg-green-500/10 text-green-600" :
                order.status === "pending" ? "bg-amber-500/10 text-amber-600" :
                "bg-green-500/10 text-green-600"
              }`}>
                {order.status || "pending"}
              </span>
            </div>
          </div>

          {/* Delivery info */}
          <div className="rounded-2xl bg-sky-500/5 border border-sky-500/15 p-4 space-y-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-sky-600 mb-2">📦 Delivery Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {order.delivery?.name && (
                <div>
                  <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Name</p>
                  <p className="font-semibold">{order.delivery.name}</p>
                </div>
              )}
              {order.delivery?.phone && (
                <div>
                  <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Phone</p>
                  <p className="font-semibold">{order.delivery.phone}</p>
                </div>
              )}
              {order.delivery?.address && (
                <div className="sm:col-span-2">
                  <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Address</p>
                  <p className="font-semibold">
                    {[order.delivery.address, order.delivery.city, order.delivery.state]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="space-y-1.5">
            {(order.items || []).map((item, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-[var(--surface)] px-3 py-2">
                <img src={item.image} className="w-10 h-10 rounded-lg object-cover bg-white" alt="" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{item.name}</p>
                  <p className="text-[10px] text-[var(--muted)]">{fmt(item.price)} × {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2 pb-4">
          <button onClick={() => goTo(safePage - 1)} disabled={safePage <= 1}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface)] transition disabled:opacity-30 disabled:cursor-not-allowed">
            Prev
          </button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => {
              const p = i + 1;
              return (
                <button key={p} onClick={() => goTo(p)}
                  className={`min-w-[40px] text-center rounded-xl px-3 py-2 text-sm border transition ${
                    p === safePage ? "bg-[var(--foreground)] text-[var(--surface-strong)] border-[var(--foreground)]" : "border-[var(--border)] hover:bg-[var(--surface)]"
                  }`}>
                  {p}
                </button>
              );
            })}
          </div>
          <button onClick={() => goTo(safePage + 1)} disabled={safePage >= totalPages}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface)] transition disabled:opacity-30 disabled:cursor-not-allowed">
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function AllOrdersTab({ orders, loadingOrders }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(orders.length / ORDERS_PER_PAGE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paginated = orders.slice(
    (safePage - 1) * ORDERS_PER_PAGE,
    safePage * ORDERS_PER_PAGE
  );
  const goTo = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  const now = new Date();
  const thisMonthStats = getMonthStats(orders, now.getFullYear(), now.getMonth());
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStats = getMonthStats(orders, prevDate.getFullYear(), prevDate.getMonth());

  const revenueChange = lastMonthStats.revenue > 0
    ? (((thisMonthStats.revenue - lastMonthStats.revenue) / lastMonthStats.revenue) * 100).toFixed(1)
    : null;
  const ordersChange = lastMonthStats.count > 0
    ? (((thisMonthStats.count - lastMonthStats.count) / lastMonthStats.count) * 100).toFixed(1)
    : null;
  const revenueUp = revenueChange !== null && parseFloat(revenueChange) >= 0;
  const ordersUp = ordersChange !== null && parseFloat(ordersChange) >= 0;

  if (loadingOrders) return <PageLoader text="Loading orders" />;

  return (
    <div className="space-y-6">
      {/* This month summary */}
      <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[var(--muted)]">Monthly Breakdown</p>
            <p className="text-sm font-bold mt-0.5">{MONTH_NAMES[now.getMonth()]}</p>
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
            ) : <span className="text-[10px] text-[var(--muted)]">No prior month data</span>}
          </div>
          <div className="p-4 sm:p-5 space-y-2">
            <p className="text-[9px] uppercase tracking-widest font-bold text-[var(--muted)]">Orders</p>
            <p className="text-xl sm:text-2xl font-black tabular-nums">{thisMonthStats.count}</p>
            {ordersChange !== null ? (
              <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${ordersUp ? "text-emerald-600" : "text-red-500"}`}>
                {ordersUp ? "▲" : "▼"} {ordersUp ? "+" : ""}{ordersChange}% vs last month
              </span>
            ) : <span className="text-[10px] text-[var(--muted)]">No prior month data</span>}
          </div>
        </div>
      </div>

      {/* All orders */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          All orders ({orders.length})
        </h2>

        {orders.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[var(--border)] py-20 text-center text-sm text-[var(--muted)]">No orders found.</div>
        ) : (
          <>
            {paginated.map((order) => (
              <div key={order.id} className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-5 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)]/50 pb-4">
                  <div>
                    <p className="text-sm font-bold leading-tight">{order.userName || "Customer"}</p>
                    <p className="text-xs text-[var(--muted)] mt-1">{order.userEmail}</p>
                    <p className="text-[10px] text-[var(--muted)] opacity-60 mt-1 uppercase">{fmtDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                    <p className="text-lg font-bold text-[var(--price)]">{fmt(order.total || 0)}</p>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                      order.status === "paid" ? "bg-green-500/10 text-green-600" :
                      "bg-amber-500/10 text-amber-600"
                    }`}>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2 pb-4">
                <button onClick={() => goTo(safePage - 1)} disabled={safePage <= 1}
                  className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface)] transition disabled:opacity-30 disabled:cursor-not-allowed">
                  Prev
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button key={p} onClick={() => goTo(p)}
                        className={`min-w-[40px] text-center rounded-xl px-3 py-2 text-sm border transition ${
                          p === safePage ? "bg-[var(--foreground)] text-[var(--surface-strong)] border-[var(--foreground)]" : "border-[var(--border)] hover:bg-[var(--surface)]"
                        }`}>
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => goTo(safePage + 1)} disabled={safePage >= totalPages}
                  className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface)] transition disabled:opacity-30 disabled:cursor-not-allowed">
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function OrdersTab({ orders = [], loadingOrders }) {
  const [subTab, setSubTab] = useState("orders");

  const deliveryCount = orders.filter(
    (o) => o.delivery?.phone || o.delivery?.address
  ).length;

  return (
    <div className="w-full space-y-6">
      {/* Sub-tab navigation */}
      <div className="flex gap-1 p-1 rounded-2xl bg-[var(--surface)] border border-[var(--border)] w-fit">
        <button
          onClick={() => setSubTab("orders")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            subTab === "orders"
              ? "bg-[var(--surface-strong)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          All Orders
        </button>
        <button
          onClick={() => setSubTab("delivery")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            subTab === "delivery"
              ? "bg-[var(--surface-strong)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Delivery
          {deliveryCount > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-sky-500 text-[9px] font-black text-white">
              {deliveryCount}
            </span>
          )}
        </button>
      </div>

      {subTab === "orders" && <AllOrdersTab orders={orders} loadingOrders={loadingOrders} />}
      {subTab === "delivery" && <DeliveryTab orders={orders} />}
    </div>
  );
}