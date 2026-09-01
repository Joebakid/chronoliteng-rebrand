"use client";

import { useState } from "react";
import PageLoader from "@/components/PageLoader";

const ORDERS_PER_PAGE = 8;

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
      <button className="absolute top-6 right-6 text-white text-2xl hover:scale-110 transition-transform">✕</button>
      <img 
        src={src} 
        className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300 object-contain" 
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
  const paginated = ordersWithDelivery.slice((page - 1) * ORDERS_PER_PAGE, page * ORDERS_PER_PAGE);

  if (ordersWithDelivery.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-[var(--border)] py-20 text-center">
        <p className="text-sm text-[var(--muted)]">No delivery details found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {paginated.map((order) => (
        <div key={order.id} className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)]/50 pb-3">
             <div>
                <p className="text-sm font-bold text-[var(--foreground)]">
                  {order.userName} — <span className="text-[var(--accent)] font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                </p>
                <p className="text-[10px] font-mono text-[var(--muted)] opacity-70">ID: {order.id}</p>
             </div>
             <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
               {order.paymentType === "installment" ? "Plan Completed" : "Paid"}
             </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)]/30">
            <div className="space-y-1">
                <p className="text-[9px] text-[var(--muted)] font-black uppercase tracking-widest">Contact</p>
                <p className="font-bold">{order.delivery?.phone || order.userEmail}</p>
            </div>
            <div className="space-y-1">
                <p className="text-[9px] text-[var(--muted)] font-black uppercase tracking-widest">Address</p>
                <p className="font-bold leading-relaxed">{order.delivery?.address}, {order.delivery?.city}, {order.delivery?.state}</p>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {order.items?.map((item, i) => (
               <div key={i} className="relative group shrink-0">
                  <img 
                    src={resolveItemImage(item)} 
                    onClick={() => onExpandImage(resolveItemImage(item))}
                    className="w-14 h-14 rounded-xl bg-white border border-[var(--border)] cursor-zoom-in hover:scale-105 transition shadow-sm object-contain p-1"
                    alt=""
                  />
                  <span className="absolute -top-1 -right-1 bg-[var(--foreground)] text-[var(--background)] text-[8px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                    {item.quantity}
                  </span>
               </div>
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

  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  const paginated = orders.slice((page - 1) * ORDERS_PER_PAGE, page * ORDERS_PER_PAGE);

  if (loadingOrders) return <div className="py-20"><PageLoader text="Syncing orders..." /></div>;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {paginated.map((order) => {
          const isExpanded = expandedOrderId === order.id;
          const userFriendlyId = order.id.slice(-6).toUpperCase();

          return (
            <div 
              key={order.id} 
              className={`rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${
                isExpanded ? "border-[var(--accent)] bg-[var(--surface)] shadow-xl" : "border-[var(--border)] bg-[var(--surface-strong)]"
              }`}
            >
              {/* Header */}
              <div 
                className="p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
              >
                <div className="flex items-center gap-4">
                   <div className={`h-2 w-2 rounded-full ${isExpanded ? "bg-[var(--accent)] animate-pulse" : "bg-[var(--muted)] opacity-30"}`} />
                   <div>
                    <p className="text-sm font-bold tracking-tight text-[var(--foreground)]">
                      {order.userName || "Guest Customer"} — <span className="text-[var(--accent)]">#{userFriendlyId}</span>
                    </p>
                    <p className="text-[10px] text-[var(--muted)] font-medium mt-0.5 uppercase tracking-wider">{fmtDate(order.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="text-right">
                    <p className="text-xl font-black text-[var(--foreground)] tracking-tighter">{fmt(order.totalAmount || order.total || 0)}</p>
                    <p className="text-[9px] text-[var(--muted)] font-bold uppercase tracking-widest">{order.items?.length} Items Ordered</p>
                  </div>
                  <div className={`h-8 w-8 rounded-full border border-[var(--border)] flex items-center justify-center transition-transform duration-500 ${isExpanded ? "rotate-180 bg-[var(--accent)] text-white border-transparent" : "text-[var(--muted)]"}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              {/* Collapsible Content */}
              {isExpanded && (
                <div className="px-6 pb-6 space-y-6 animate-in slide-in-from-top-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[var(--border)]/50">
                    
                    {/* CUSTOMER HASH / ID SECTION */}
                    <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">Order Information</p>
                      <div className="space-y-1">
                         <p className="text-[10px] font-mono text-[var(--accent)] font-bold bg-[var(--surface-strong)] p-2.5 rounded-xl border border-[var(--border)]">
                            SHORT_ID: #{userFriendlyId}
                         </p>
                         <p className="text-[9px] font-mono text-[var(--muted)] break-all bg-black/10 p-2.5 rounded-xl border border-[var(--border)]">
                            FULL_ID: {order.id}
                         </p>
                         <p className="text-[9px] font-mono text-[var(--muted)] break-all bg-black/10 p-2.5 rounded-xl border border-[var(--border)]">
                            PAYSTACK_REF: {order.paystackRef || "N/A"}
                         </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">Customer Details</p>
                      <div className="text-xs space-y-1">
                         <p className="font-bold">{order.userEmail}</p>
                         <p className="text-[var(--muted)]">{order.delivery?.phone || "No phone provided"}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">Shipping Address</p>
                      <p className="text-xs font-medium leading-relaxed italic opacity-80">
                        {order.delivery?.address}, {order.delivery?.city}, {order.delivery?.state}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">Items Breakdown</p>
                    <div className="grid gap-2">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex items-center gap-4 bg-[var(--surface-strong)]/50 p-3 rounded-2xl border border-[var(--border)]/50 group hover:border-[var(--accent)] transition-colors">
                          <img 
                            src={resolveItemImage(item)} 
                            className="w-14 h-14 rounded-xl bg-white object-contain shadow-sm cursor-zoom-in transition-transform group-hover:scale-105 p-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              onExpandImage(resolveItemImage(item));
                            }}
                            alt=""
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate group-hover:text-[var(--accent)] transition-colors">{item.name}</p>
                            <p className="text-[10px] font-bold text-[var(--muted)] mt-0.5">
                              {fmt(item.price)} <span className="opacity-40 mx-1">×</span> {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                             <p className="text-xs font-black">{fmt(item.price * item.quantity)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-6 py-2.5 rounded-full border border-[var(--border)] text-[10px] font-bold uppercase tracking-widest disabled:opacity-20 hover:bg-[var(--surface)]"
          >
            Previous
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">
            Page {page} <span className="opacity-20 mx-2">/</span> {totalPages}
          </span>
          <button 
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="px-6 py-2.5 rounded-full border border-[var(--border)] text-[10px] font-bold uppercase tracking-widest disabled:opacity-20 hover:bg-[var(--surface)]"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function OrdersTab({ orders = [], loadingOrders }) {
  const [subTab, setSubTab] = useState("orders");
  const [expandedImage, setExpandedImage] = useState(null);

  // ONLY show completed orders (Full payments OR 100% completed installment plans)
  const completedOrders = orders.filter((order) => {
    const isInstallment = order.paymentType === "installment" || Boolean(order.installmentPlan);
    if (!isInstallment) return true;
    return order.paymentStatus === "fully_paid" || (order.balanceDue || 0) <= 0;
  });

  // Sort orders by newest first
  const sortedOrders = [...completedOrders].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div className="w-full space-y-6">
      <ImageModal src={expandedImage} onClose={() => setExpandedImage(null)} />

      <div className="flex gap-1 p-1 rounded-2xl bg-[var(--surface)] border border-[var(--border)] w-fit">
        <button
          onClick={() => setSubTab("orders")}
          className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
            subTab === "orders" ? "bg-[var(--surface-strong)] text-[var(--foreground)] shadow-sm": "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          All Activity
        </button>
        <button
          onClick={() => setSubTab("delivery")}
          className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
            subTab === "delivery" ? "bg-[var(--surface-strong)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Shipping List
        </button>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {subTab === "orders" ? (
          <AllOrdersTab 
            orders={sortedOrders} 
            loadingOrders={loadingOrders} 
            onExpandImage={setExpandedImage} 
          />
        ) : (
          <DeliveryTab 
            orders={sortedOrders} 
            onExpandImage={setExpandedImage} 
          />
        )}
      </div>
    </div>
  );
}