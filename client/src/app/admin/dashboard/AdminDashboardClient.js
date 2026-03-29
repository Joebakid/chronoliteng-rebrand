"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getProducts, getAdminAnalytics, getUsers, getAdminOrders, getPhysicalSales } from "@/lib/api";
import { calcProfit } from "./dashboardUtils";

import DashboardStats from "./DashboardStats";
import DashboardMonthCard from "./DashboardMonthCard";
import DashboardProfitCard from "./DashboardProfitCard";
import DashboardTabs from "./DashboardTabs";

import ProductsTab from "./ProductsTab";
import UsersTab from "./UsersTab";
import OrdersTab from "./OrdersTab";
import InTransitTab from "./InTransitTab";
import PhysicalSalesTab from "./PhysicalSalesTab";
import CategoriesTab from "./CategoriesTab";
import PromosTab from "./PromosTab"; // Matches the new file name
import PageLoader from "@/components/PageLoader";

export default function AdminDashboardClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState("Products");
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [physicalSales, setPhysicalSales] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });

  const [analytics, setAnalytics] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalItemsSold: 0,
    averagePrice: 0,
    highestPrice: 0,
  });

  const fetchAll = async () => {
    setFetching(true);
    try {
      const [productsData, analyticsData, usersData] = await Promise.all([
        getProducts(),
        getAdminAnalytics(),
        getUsers(),
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
      const [onlineData, physicalData] = await Promise.all([
        getAdminOrders(),
        getPhysicalSales(),
      ]);
      setOrders(onlineData || []);
      setPhysicalSales(physicalData || []);
    } catch (err) {
      console.error("[AdminDashboard] orders error:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSaleRecorded = useCallback(() => { fetchOrders(); }, []);

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { fetchOrders(); }, []);
  useEffect(() => { if (activeTab === "Orders") fetchOrders(); }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const netProfit = calcProfit(orders, physicalSales, products);
  const inTransitCount = products.filter((p) => p.inTransit).length;
  const walkInCount = physicalSales.length;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 pb-20 overflow-x-hidden">

      {/* Status banner */}
      {status.message && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300 ${
          status.type === "error"
            ? "bg-red-50 text-red-700 border border-red-200"
            : "bg-green-50 text-green-700 border border-green-200"
        }`}>
          <div className="flex items-center justify-between">
            <span>{status.message}</span>
            <button onClick={() => setStatus({ type: "", message: "" })} className="text-xs uppercase font-bold opacity-50">Close</button>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <DashboardStats
        analytics={analytics}
        products={products}
        physicalSales={physicalSales}
        fetching={fetching}
      />

      {/* Charts / Profit */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardMonthCard orders={orders} physicalSales={physicalSales} loading={loadingOrders} />
        <DashboardProfitCard netProfit={netProfit} loading={loadingOrders} />
      </div>

      {/* Navigation */}
      <div className="sticky top-0 z-30 bg-[var(--background)] py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <DashboardTabs
          activeTab={activeTab}
          onChange={handleTabChange}
          inTransitCount={inTransitCount}
          walkInCount={walkInCount}
        />
      </div>

      {/* Content */}
      <Suspense fallback={<PageLoader text={`Loading ${activeTab}...`} />}>
        <div className="min-h-[400px] w-full">
          {activeTab === "Products" && (
            <ProductsTab products={products} fetching={fetching} onRefresh={fetchAll} onStatusChange={setStatus} />
          )}
          {activeTab === "Walk-in" && (
            <PhysicalSalesTab products={products} onSaleRecorded={handleSaleRecorded} />
          )}
          {activeTab === "In Transit" && (
            <InTransitTab products={products} fetching={fetching} onRefresh={fetchAll} />
          )}
          {/* Renders the new Promotions Tab */}
          {activeTab === "Promotions" && (
            <PromosTab products={products} onStatusChange={setStatus} />
          )}
          {activeTab === "Users" && (
            <UsersTab users={users} fetching={fetching} />
          )}
          {activeTab === "Orders" && (
            <OrdersTab orders={orders} loadingOrders={loadingOrders} />
          )}
          {activeTab === "Settings" && (
            <CategoriesTab />
          )}
        </div>
      </Suspense>
    </div>
  );
}