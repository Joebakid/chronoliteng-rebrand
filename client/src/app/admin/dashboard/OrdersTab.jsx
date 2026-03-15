"use client";

import { useState } from "react";
import PageLoader from "@/components/PageLoader";

const ORDERS_PER_PAGE = 10;
const fmt = (n) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
const fmtDate = (value) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
};

export default function OrdersTab({ orders, loadingOrders }) {
  const [ordersPage, setOrdersPage] = useState(1);

  const totalOrderPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  const paginatedOrders = orders.slice((ordersPage - 1) * ORDERS_PER_PAGE, ordersPage * ORDERS_PER_PAGE);

  return (
    <div>
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
        All orders ({orders.length})
      </h2>

      {loadingOrders ? (
        <PageLoader text="Loading orders" />
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] px-5 py-10 text-center text-sm text-[var(--muted)]">
          No orders yet.
        </div>
      ) : (
        <>
          <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] overflow-hidden">
            {paginatedOrders.map((order) => (
              <div key={order.id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold">{order.userName || "—"}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{order.userEmail}</p>
                    <p className="text-xs text-[var(--muted)] opacity-60 mt-0.5">{fmtDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-[var(--price)]">{fmt(order.total || 0)}</p>
                    <div className="mt-1 flex items-center gap-1.5 justify-end flex-wrap">
                      <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${order.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                        {order.status || "pending"}
                      </span>
                      {order.paymentMethod && (
                        <span className="text-[0.6rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-[var(--surface)] text-[var(--muted)]">
                          {order.paymentMethod}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {(order.items || []).map((item, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-[var(--surface)] px-3 py-2">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-[var(--border)]" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[var(--border)] flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{item.name}</p>
                        <p className="text-xs text-[var(--muted)]">{fmt(item.price || 0)} × {item.quantity}</p>
                      </div>
                      <p className="text-xs font-semibold flex-shrink-0">{fmt((item.price || 0) * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                {order.paystackRef && (
                  <p className="mt-2 text-[0.65rem] text-[var(--muted)] opacity-60">Ref: {order.paystackRef}</p>
                )}
              </div>
            ))}
          </div>

          {totalOrderPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4">
              <button
                onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                disabled={ordersPage === 1}
                className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold disabled:opacity-40 transition hover:bg-[var(--surface)]"
              >← Prev</button>
              <p className="text-xs text-[var(--muted)]">
                Page {ordersPage} of {totalOrderPages} · {orders.length} orders
              </p>
              <button
                onClick={() => setOrdersPage((p) => Math.min(totalOrderPages, p + 1))}
                disabled={ordersPage === totalOrderPages}
                className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold disabled:opacity-40 transition hover:bg-[var(--surface)]"
              >Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}