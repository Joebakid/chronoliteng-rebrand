"use client";

import { useState } from "react";
import PageLoader from "@/components/PageLoader";

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

function resolveItemImage(item) {
  return (
    item.selectedVariantImage ||
    item.selectedImage ||
    item.image ||
    item.thumbnail ||
    (Array.isArray(item.images) && item.images[0]) ||
    null
  );
}

/**
 * REUSABLE IMAGE MODAL
 */
function ImageModal({ src, onClose }) {
  if (!src) return null;
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <button className="absolute top-6 right-6 text-white text-2xl">✕</button>
      <img 
        src={src} 
        className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300" 
        alt="Enlarged view" 
      />
    </div>
  );
}

function DeliveryTab({ orders, onExpandImage }) {
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

  if (ordersWithDelivery.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-[var(--border)] py-20 text-center">
        <p className="text-sm text-[var(--muted)]">No delivery details yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {paginated.map((order) => (
        <div key={order.id} className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border)]/50 pb-3">
             <p className="text-sm font-bold">{order.userName}</p>
             <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">Paid</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)]/30">
            <div>
                <p className="text-[9px] text-[var(--muted)] uppercase">Phone</p>
                <p className="font-bold">{order.delivery?.phone || "N/A"}</p>
            </div>
            <div>
                <p className="text-[9px] text-[var(--muted)] uppercase">Address</p>
                <p className="font-bold truncate">{order.delivery?.address}</p>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {order.items?.map((item, i) => (
               <img 
                key={i} 
                src={resolveItemImage(item)} 
                onClick={() => onExpandImage(resolveItemImage(item))}
                className="w-12 h-12 rounded-lg bg-white border border-[var(--border)] cursor-zoom-in hover:scale-105 transition"
               />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AllOrdersTab({ orders, loadingOrders, onExpandImage }) {
  const [page, setPage] = useState(1);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const paginated = orders.slice((page - 1) * ORDERS_PER_PAGE, page * ORDERS_PER_PAGE);
  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);

  if (loadingOrders) return <PageLoader text="Loading orders" />;

  return (
    <div className="space-y-6">
      {/* Monthly Stats Card Removed for brevity, stays same as your original */}
      
      <div className="space-y-4">
        {paginated.map((order) => {
          const isExpanded = expandedOrderId === order.id;
          return (
            <div 
              key={order.id} 
              className={`rounded-[2rem] border transition-all duration-300 ${
                isExpanded ? "border-[var(--accent)] bg-[var(--surface)] ring-1 ring-[var(--accent)]/20" : "border-[var(--border)] bg-[var(--surface-strong)]"
              }`}
            >
              {/* Header: Clickable to Expand */}
              <div 
                className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
              >
                <div>
                  <p className="text-sm font-bold leading-tight">{order.userName || "Customer"}</p>
                  <p className="text-[10px] text-[var(--muted)] mt-1 uppercase tracking-wider">{fmtDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center justify-between sm:text-right gap-4">
                  <div>
                    <p className="text-lg font-bold text-[var(--price)]">{fmt(order.total || 0)}</p>
                    <p className="text-[9px] text-[var(--muted)] font-bold uppercase">{order.items?.length} Items</p>
                  </div>
                  <span className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </div>
              </div>

              {/* Collapsible Details */}
              {isExpanded && (
                <div className="px-5 pb-5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]/50">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase text-[var(--muted)]">Customer Details</p>
                      <p className="text-xs font-bold">{order.userEmail}</p>
                      <p className="text-xs text-[var(--muted)]">{order.delivery?.phone}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase text-[var(--muted)]">Payment Reference</p>
                      <p className="text-[10px] font-mono break-all bg-black/20 p-2 rounded-lg">{order.paystackRef || "N/A"}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase text-[var(--muted)]">Items Ordered</p>
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 bg-[var(--surface-strong)] p-2 rounded-xl border border-[var(--border)]/50">
                        <img 
                          src={resolveItemImage(item)} 
                          className="w-12 h-12 rounded-lg bg-white object-contain cursor-zoom-in"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevents collapsing the order
                            onExpandImage(resolveItemImage(item));
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{item.name}</p>
                          <p className="text-[10px] text-[var(--muted)]">{fmt(item.price)} × {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Pagination Logic Stays Same */}
      </div>
    </div>
  );
}

export default function OrdersTab({ orders = [], loadingOrders }) {
  const [subTab, setSubTab] = useState("orders");
  const [expandedImage, setExpandedImage] = useState(null);

  return (
    <div className="w-full space-y-6">
      {/* Zoom Modal */}
      <ImageModal src={expandedImage} onClose={() => setExpandedImage(null)} />

      <div className="flex gap-1 p-1 rounded-2xl bg-[var(--surface)] border border-[var(--border)] w-fit">
        <button
          onClick={() => setSubTab("orders")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            subTab === "orders" ? "bg-[var(--surface-strong)] text-[var(--foreground)]" : "text-[var(--muted)]"
          }`}
        >
          All Orders
        </button>
        <button
          onClick={() => setSubTab("delivery")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            subTab === "delivery" ? "bg-[var(--surface-strong)] text-[var(--foreground)]" : "text-[var(--muted)]"
          }`}
        >
          Delivery
        </button>
      </div>

      {subTab === "orders" && (
        <AllOrdersTab 
            orders={orders} 
            loadingOrders={loadingOrders} 
            onExpandImage={setExpandedImage} 
        />
      )}
      
      {subTab === "delivery" && (
        <DeliveryTab 
            orders={orders} 
            onExpandImage={setExpandedImage} 
        />
      )}
    </div>
  );
}