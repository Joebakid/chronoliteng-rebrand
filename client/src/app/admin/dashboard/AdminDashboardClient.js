"use client";

import { useEffect, useState, Suspense, useCallback, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAppContext } from "@/app/state/AppContext";
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
import PromosTab from "./PromosTab";
import PageLoader from "@/components/PageLoader";

// Main admin email - sees everything
const MAIN_ADMIN_EMAIL = "josephbawo@gmail.com";

export default function AdminDashboardClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, authLoading } = useAppContext();

  const [activeTab, setActiveTab] = useState("Products");
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [physicalSales, setPhysicalSales] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });

  // State to track which month the user is viewing
  const [viewingMonth, setViewingMonth] = useState(new Date().getMonth());
  const [viewingYear, setViewingYear] = useState(new Date().getFullYear());

  const [analytics, setAnalytics] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalItemsSold: 0,
  });

  const fetchAll = async () => {
    setFetching(true);
    try {
      const adminId = user?.id || null;
      const adminEmail = user?.email || null;
      const [productsData, analyticsData, usersData] = await Promise.all([
        getProducts(adminId, adminEmail),
        getAdminAnalytics(adminId, adminEmail),
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
      const adminId = user?.id || null;
      const adminEmail = user?.email || null;

      const [onlineData, physicalData, productsData] = await Promise.all([
        getAdminOrders(),
        getPhysicalSales(),
        getProducts(adminId, adminEmail),
      ]);

      // Main admin sees all orders
      if (adminEmail === MAIN_ADMIN_EMAIL) {
        setOrders(onlineData || []);
        setPhysicalSales(physicalData || []);
      } else if (adminId) {
        // Other admins - filter by their products
        const adminProductIds = new Set(productsData.map((p) => p.id));

        const filteredOrders = (onlineData || []).filter((order) =>
          order.items?.some((item) => adminProductIds.has(item.productId || item.id))
        );

        const filteredPhysicalSales = (physicalData || []).filter((sale) =>
          sale.items?.some((item) => adminProductIds.has(item.productId || item.id))
        );

        setOrders(filteredOrders);
        setPhysicalSales(filteredPhysicalSales);
      } else {
        setOrders(onlineData || []);
        setPhysicalSales(physicalData || []);
      }
    } catch (err) {
      console.error("[AdminDashboard] orders error:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSaleRecorded = useCallback(() => { fetchOrders(); }, []);

  // Wait for auth to load before fetching data
  useEffect(() => {
    if (!authLoading) {
      fetchAll();
    }
  }, [authLoading]);
  useEffect(() => {
    if (!authLoading) {
      fetchOrders();
    }
  }, [authLoading]);
  useEffect(() => { if (activeTab === "Orders") fetchOrders(); }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  /**
   * CALCULATE STATS FOR SELECTED MONTH ONLY
   * This ensures the top cards show 0 if April is selected and there are no sales.
   */
  const selectedMonthStats = useMemo(() => {
    const inMonth = (o) => {
      const d = new Date(o.createdAt);
      return d.getFullYear() === viewingYear && d.getMonth() === viewingMonth;
    };

    const monthlyOnline = orders.filter(inMonth);
    const monthlyPhysical = physicalSales.filter(inMonth);

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
  }, [orders, physicalSales, viewingMonth, viewingYear]);

  // Calculate profit using the dynamic viewing month/year
  const netProfit = calcProfit(orders, physicalSales, products, viewingMonth, viewingYear);

  const inTransitCount = products.filter((p) => p.inTransit).length;
  const walkInCount = physicalSales.filter(s => {
    const d = new Date(s.createdAt);
    return d.getMonth() === viewingMonth && d.getFullYear() === viewingYear;
  }).length;

  // Show loading state while auth is loading
  if (authLoading) {
    return <PageLoader text="Loading dashboard..." />;
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 pb-20 overflow-x-hidden">

      {status.message && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300 ${
          status.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
        }`}>
          <div className="flex items-center justify-between">
            <span>{status.message}</span>
            <button onClick={() => setStatus({ type: "", message: "" })} className="text-xs uppercase font-bold opacity-50">Close</button>
          </div>
        </div>
      )}

      {/* TOP CARDS: Now using selectedMonthStats to show 0 for current month if no activity */}
      <DashboardStats
        products={products}
        fetching={fetching || loadingOrders}
        selectedMonthStats={selectedMonthStats}
      />

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

      <div className="sticky top-0 z-30 bg-[var(--background)] py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <DashboardTabs
          activeTab={activeTab}
          onChange={handleTabChange}
          inTransitCount={inTransitCount}
          walkInCount={walkInCount}
        />
      </div>

      <Suspense fallback={<PageLoader text={`Loading ${activeTab}...`} />}>
        <div className="min-h-[400px] w-full">
          {activeTab === "Products" && (
            <ProductsTab products={products} fetching={fetching} onRefresh={fetchAll} onStatusChange={setStatus} user={user} />
          )}
          {activeTab === "Walk-in" && (
            <PhysicalSalesTab products={products} onSaleRecorded={handleSaleRecorded} />
          )}
          {activeTab === "In Transit" && (
            <InTransitTab products={products} fetching={fetching} onRefresh={fetchAll} />
          )}
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
            <CategoriesTab user={user} />
          )}
        </div>
      </Suspense>
    </div>
  );
}
