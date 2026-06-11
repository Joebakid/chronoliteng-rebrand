"use client";

import { useEffect, useState, Suspense, useCallback, useMemo, memo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAppContext } from "@/app/state/AppContext";
import { getProducts, getAdminAnalytics, getUsers, getAdminOrders, getPhysicalSales } from "@/lib/api";
import { calcProfit, buildCostMap } from "./dashboardUtils";

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
import PromosTab from "./PromosTab";
import SupplierTab from "./SupplierTab"; // <-- NEW IMPORT
import PageLoader from "@/components/PageLoader";

// Constants
const MAIN_ADMIN_EMAIL = "josephbawo@gmail.com";

/**
 * Optimized Admin Dashboard Client
 * - Uses React.memo for expensive components
 * - Memoizes computed values with useMemo
 * - Batches API calls efficiently
 * - Uses lazy loading for tabs
 */
export default function AdminDashboardClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, authLoading } = useAppContext();

  // State
  const [activeTab, setActiveTab] = useState("Products");
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [physicalSales, setPhysicalSales] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [viewingMonth, setViewingMonth] = useState(new Date().getMonth());
  const [viewingYear, setViewingYear] = useState(new Date().getFullYear());

  // Build cost map once when products change
  const costMap = useMemo(() => buildCostMap(products), [products]);

  // Fetch initial data (products, users, analytics)
  const fetchAll = useCallback(async () => {
    setFetching(true);
    try {
      const adminId = user?.id || null;
      const adminEmail = user?.email || null;

      // Batch all initial requests
      const [productsData, usersData] = await Promise.all([
        getProducts(adminId, adminEmail),
        getUsers(),
      ]);

      setProducts(Array.isArray(productsData) ? productsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Unable to load data." });
    } finally {
      setFetching(false);
    }
  }, [user?.id, user?.email]);

  // Fetch orders and physical sales
  const fetchOrders = useCallback(async () => {
    // Skip if already loaded
    if (orders.length > 0 && physicalSales.length > 0) return;

    setLoadingOrders(true);
    try {
      const adminId = user?.id || null;
      const adminEmail = user?.email || null;

      const [onlineData, physicalData] = await Promise.all([
        getAdminOrders(),
        getPhysicalSales(),
      ]);

      // Main admin sees all orders
      if (adminEmail === MAIN_ADMIN_EMAIL) {
        setOrders(onlineData || []);
        setPhysicalSales(physicalData || []);
      } else if (adminId) {
        // Other admins - filter by their products
        const adminProductIds = new Set(products.map((p) => p.id));

        setOrders((onlineData || []).filter((order) =>
          order.items?.some((item) => adminProductIds.has(item.productId || item.id))
        ));
        setPhysicalSales((physicalData || []).filter((sale) =>
          sale.items?.some((item) => adminProductIds.has(item.productId || item.id))
        ));
      } else {
        setOrders(onlineData || []);
        setPhysicalSales(physicalData || []);
      }
    } catch (err) {
      console.error("[AdminDashboard] orders error:", err);
    } finally {
      setLoadingOrders(false);
    }
  }, [user?.id, user?.email, products, orders.length, physicalSales.length]);

  // Refetch orders (for callbacks)
  const refetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const adminId = user?.id || null;
      const adminEmail = user?.email || null;

      const [onlineData, physicalData] = await Promise.all([
        getAdminOrders(),
        getPhysicalSales(),
      ]);

      if (adminEmail === MAIN_ADMIN_EMAIL) {
        setOrders(onlineData || []);
        setPhysicalSales(physicalData || []);
      } else if (adminId) {
        const adminProductIds = new Set(products.map((p) => p.id));
        setOrders((onlineData || []).filter((order) =>
          order.items?.some((item) => adminProductIds.has(item.productId || item.id))
        ));
        setPhysicalSales((physicalData || []).filter((sale) =>
          sale.items?.some((item) => adminProductIds.has(item.productId || item.id))
        ));
      } else {
        setOrders(onlineData || []);
        setPhysicalSales(physicalData || []);
      }
    } catch (err) {
      console.error("[AdminDashboard] orders error:", err);
    } finally {
      setLoadingOrders(false);
    }
  }, [user?.id, user?.email, products]);

  // Memoized callback for sale recorded
  const handleSaleRecorded = useCallback(() => {
    refetchOrders();
  }, [refetchOrders]);

  // Fetch data after auth loads
  useEffect(() => {
    if (!authLoading) {
      fetchAll();
    }
  }, [authLoading, fetchAll]);

  // Fetch orders after auth loads (separate to not block initial render)
  useEffect(() => {
    if (!authLoading && products.length > 0) {
      fetchOrders();
    }
  }, [authLoading, products.length, fetchOrders]);

  // Handle tab change
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  // Memoized: Filter orders by month
  const monthlyData = useMemo(() => {
    const inMonth = (item) => {
      const d = new Date(item.createdAt);
      return d.getFullYear() === viewingYear && d.getMonth() === viewingMonth;
    };

    const monthlyOnline = orders.filter(inMonth);
    const monthlyPhysical = physicalSales.filter(inMonth);

    return { monthlyOnline, monthlyPhysical };
  }, [orders, physicalSales, viewingMonth, viewingYear]);

  // Memoized: Calculate month stats
  const selectedMonthStats = useMemo(() => {
    const { monthlyOnline, monthlyPhysical } = monthlyData;

    const revenue =
      monthlyOnline.reduce((s, o) => s + (o.total || 0), 0) +
      monthlyPhysical.reduce((s, o) => s + (o.total || 0), 0);

    const itemsSold =
      monthlyOnline.reduce((s, o) => s + (o.items?.length || 0), 0) +
      monthlyPhysical.reduce((s, o) => s + (o.items?.length || 0), 0);

    return {
      revenue,
      count: monthlyOnline.length + monthlyPhysical.length,
      physicalCount: monthlyPhysical.length,
      itemsSold
    };
  }, [monthlyData]);

  // Memoized: Calculate profit
  const netProfit = useMemo(
    () => calcProfit(monthlyData.monthlyOnline, monthlyData.monthlyPhysical, costMap, viewingMonth, viewingYear),
    [monthlyData, costMap, viewingMonth, viewingYear]
  );

  // Memoized: Count in-transit products
  const inTransitCount = useMemo(
    () => products.filter((p) => p.inTransit).length,
    [products]
  );

  // Memoized: Count walk-in sales for current month
  const walkInCount = useMemo(
    () => monthlyData.monthlyPhysical.length,
    [monthlyData]
  );

  // Show loading state while auth is loading
  if (authLoading) {
    return <PageLoader text="Loading dashboard..." />;
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 pb-20 overflow-x-hidden">
      {status.message && (
        <StatusMessage status={status} onClose={() => setStatus({ type: "", message: "" })} />
      )}

      {/* TOP CARDS */}
      <DashboardStats
        products={products}
        fetching={fetching || loadingOrders}
        selectedMonthStats={selectedMonthStats}
      />

      {/* MONTH & PROFIT CARDS */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardMonthCard
          orders={orders}
          physicalSales={physicalSales}
          loading={loadingOrders}
          onMonthChange={setViewingMonth}
          onYearChange={setViewingYear}
        />

        <DashboardProfitCard
          netProfit={netProfit}
          loading={loadingOrders}
          totalSalesCount={selectedMonthStats.count}
        />
      </div>

      {/* TABS */}
      <div className="sticky top-0 z-30 bg-[var(--background)] py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <DashboardTabs
          activeTab={activeTab}
          onChange={handleTabChange}
          inTransitCount={inTransitCount}
          walkInCount={walkInCount}
        />
      </div>

      {/* TAB CONTENT */}
      <Suspense fallback={<PageLoader text={`Loading ${activeTab}...`} />}>
        <div className="min-h-[400px] w-full">
          <TabContent
            activeTab={activeTab}
            products={products}
            users={users}
            orders={orders}
            fetching={fetching}
            loadingOrders={loadingOrders}
            user={user}
            onRefresh={fetchAll}
            onStatusChange={setStatus}
            onSaleRecorded={handleSaleRecorded}
          />
        </div>
      </Suspense>
    </div>
  );
}

// Memoized status message component
const StatusMessage = memo(function StatusMessage({ status, onClose }) {
  return (
    <div className={`rounded-2xl px-4 py-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300 ${
      status.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
    }`}>
      <div className="flex items-center justify-between">
        <span>{status.message}</span>
        <button onClick={onClose} className="text-xs uppercase font-bold opacity-50">Close</button>
      </div>
    </div>
  );
});

// Memoized tab content component
const TabContent = memo(function TabContent({
  activeTab,
  products,
  users,
  orders,
  fetching,
  loadingOrders,
  user,
  onRefresh,
  onStatusChange,
  onSaleRecorded,
}) {
  switch (activeTab) {
    case "Products":
      return <ProductsTab products={products} fetching={fetching} onRefresh={onRefresh} onStatusChange={onStatusChange} user={user} />;
    case "Walk-in":
      return <PhysicalSalesTab products={products} onSaleRecorded={onSaleRecorded} />;
    case "In Transit":
      return <InTransitTab products={products} fetching={fetching} onRefresh={onRefresh} />;
    case "Promotions":
      return <PromosTab products={products} onStatusChange={onStatusChange} />;
    case "Users":
      return <UsersTab users={users} fetching={fetching} />;
    case "Orders":
      return <OrdersTab orders={orders} loadingOrders={loadingOrders} />;
    case "Settings":
      return <CategoriesTab user={user} />;
    case "Suppliers": // <-- NEW TAB ADDED HERE
      return <SupplierTab products={products} />;
    default:
      return null;
  }
});