"use client";

import { useEffect, useState } from "react";
import { getProducts, getAdminAnalytics, getUsers, getAdminOrders } from "@/lib/api";
import ProductsTab from "./ProductsTab";
import UsersTab from "./UsersTab";
import OrdersTab from "./OrdersTab";

const TABS = ["Products", "Users", "Orders"];
const fmt = (n) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Products");
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [analytics, setAnalytics] = useState({
    totalProducts: 0, totalCategories: 0, averagePrice: 0,
    highestPrice: 0, totalOrders: 0, totalRevenue: 0, totalItemsSold: 0,
  });

  const fetchAll = async () => {
    setFetching(true);
    try {
      const [productsData, analyticsData, usersData] = await Promise.all([
        getProducts(), getAdminAnalytics(), getUsers()
      ]);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setAnalytics(analyticsData);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Unable to load data." });
    } finally {
      setFetching(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await getAdminOrders();
      setOrders(data);
    } catch (err) {
      console.error("[AdminDashboard] orders error:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (activeTab === "Orders") fetchOrders(); }, [activeTab]);

  return (
    <div className="space-y-8">
      {status.message && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-medium ${status.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
          {status.message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Products",   value: fetching ? null : analytics.totalProducts || products.length },
          { label: "Orders",     value: fetching ? null : analytics.totalOrders },
          { label: "Revenue",    value: fetching ? null : fmt(analytics.totalRevenue) },
          { label: "Items Sold", value: fetching ? null : analytics.totalItemsSold },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">{label}</p>
            {value === null ? (
              <div className="mt-3 h-7 w-16 rounded-lg bg-[var(--border)] animate-pulse" />
            ) : (
              <p className="mt-3 text-2xl font-semibold">{value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border)]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold uppercase tracking-[0.16em] transition border-b-2 -mb-px ${
              activeTab === tab
                ? "border-[var(--foreground)] text-[var(--foreground)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Products" && (
        <ProductsTab
          products={products}
          fetching={fetching}
          onRefresh={fetchAll}
          onStatusChange={setStatus}
        />
      )}
      {activeTab === "Users" && (
        <UsersTab users={users} fetching={fetching} />
      )}
      {activeTab === "Orders" && (
        <OrdersTab orders={orders} loadingOrders={loadingOrders} />
      )}
    </div>
  );
}