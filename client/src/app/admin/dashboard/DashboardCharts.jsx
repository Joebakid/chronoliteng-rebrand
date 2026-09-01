"use client";

import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { formatCurrency } from "./physical-sales/utils";
import TopSoldProducts from "./TopSoldProducts";
import MostViewedProducts from "./MostViewedProducts";

const COLORS = ["#915a2f", "#1a1814", "#b0a79a", "#bf4d3b", "#e5d5c0", "#5c5c5c"];

export default function DashboardCharts({ orders = [], physicalSales = [], products = [] }) {
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const [hiddenBarSeries, setHiddenBarSeries] = useState([]);
  const [listType, setListType] = useState("sold"); // "sold" | "viewed"

  const toggleCategory = (catName) => {
    setHiddenCategories(prev => prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]);
  };

  const toggleBarSeries = (seriesName) => {
    setHiddenBarSeries(prev => prev.includes(seriesName) ? prev.filter(s => s !== seriesName) : [...prev, seriesName]);
  };

  // 1. DATA FOR PIE CHART
  const allCategoryData = useMemo(() => {
    const counts = {};
    const allSales = [...orders, ...physicalSales];

    allSales.forEach(order => {
      (order.items || []).forEach(item => {
        const product = products.find(p => p.id === (item.productId || item.id) || p.slug === item.slug);
        const cat = product?.category || "Uncategorized";
        counts[cat] = (counts[cat] || 0) + (Number(item.quantity) || 1);
      });
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [orders, physicalSales, products]);

  const activeCategoryData = allCategoryData.filter(d => !hiddenCategories.includes(d.name));

  // 2. DATA FOR BAR CHART (Accurately synced with cash flow & installments)
  const monthlyRevenueData = useMemo(() => {
    const monthsMap = {};
    const now = new Date();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const monthName = d.toLocaleString("default", { month: "short" });
      monthsMap[key] = { name: monthName, Online: 0, WalkIn: 0 };
    }

    // Process Online Orders (split installments across exact paid dates)
    orders.forEach((order) => {
      if (order.paymentType === "installment" && Array.isArray(order.installmentPlan?.schedule)) {
        order.installmentPlan.schedule.forEach((slot) => {
          if (slot.status === "paid") {
            const payDate = new Date(slot.paidAt || order.createdAt);
            if (!isNaN(payDate.getTime())) {
              const key = `${payDate.getFullYear()}-${payDate.getMonth()}`;
              if (monthsMap[key]) {
                monthsMap[key].Online += Number(slot.amount || 0);
              }
            }
          }
        });
      } else {
        const orderDate = new Date(order.createdAt);
        if (!isNaN(orderDate.getTime())) {
          const key = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;
          if (monthsMap[key]) {
            monthsMap[key].Online += Number(order.totalAmount || order.total || 0);
          }
        }
      }
    });

    // Process Physical Sales
    physicalSales.forEach((sale) => {
      const saleDate = new Date(sale.createdAt);
      if (!isNaN(saleDate.getTime())) {
        const key = `${saleDate.getFullYear()}-${saleDate.getMonth()}`;
        if (monthsMap[key]) {
          monthsMap[key].WalkIn += Number(sale.total || 0);
        }
      }
    });

    return Object.values(monthsMap);
  }, [orders, physicalSales]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--surface-strong)] border border-[var(--border)] p-3 rounded-xl shadow-xl z-50">
          <p className="font-bold text-xs text-[var(--foreground)] mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-[10px] font-bold" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      
      {/* BAR CHART: Revenue Trends */}
      <div className="lg:col-span-2 rounded-[1.5rem] sm:rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Revenue Overview</h3>
          
          <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
            <button 
              onClick={() => toggleBarSeries("Online")}
              className={`flex items-center gap-1.5 transition-opacity ${hiddenBarSeries.includes("Online") ? "opacity-30 line-through" : "opacity-100"}`}
            >
              <span className="w-2.5 h-2.5 rounded-sm bg-[var(--foreground)]"></span> Online
            </button>
            <button 
              onClick={() => toggleBarSeries("WalkIn")}
              className={`flex items-center gap-1.5 transition-opacity ${hiddenBarSeries.includes("WalkIn") ? "opacity-30 line-through" : "opacity-100"}`}
            >
              <span className="w-2.5 h-2.5 rounded-sm bg-[var(--accent)]"></span> Walk-In
            </button>
          </div>
        </div>

        <div className="h-[300px] w-full text-xs font-bold">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--muted)" tick={{ fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis 
                stroke="var(--muted)" 
                tick={{ fill: 'var(--muted)' }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(val) => `₦${(val / 1000).toFixed(0)}k`} 
              />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface)' }} />
              
              <Bar dataKey="Online" hide={hiddenBarSeries.includes("Online")} stackId="a" fill="var(--foreground)" radius={[0, 0, 4, 4]} />
              <Bar dataKey="WalkIn" hide={hiddenBarSeries.includes("WalkIn")} stackId="a" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* PIE CHART & DYNAMIC LISTS */}
      <div className="rounded-[1.5rem] sm:rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 sm:p-5 shadow-sm flex flex-col">
        <h3 className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[var(--muted)] mb-2">Sales by Category</h3>
        
        <div className="h-[180px] w-full flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={activeCategoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {activeCategoryData.map((entry, index) => {
                  const originalIndex = allCategoryData.findIndex(d => d.name === entry.name);
                  return <Cell key={`cell-${index}`} fill={COLORS[originalIndex % COLORS.length]} />
                })}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'var(--surface-strong)', borderColor: 'var(--border)', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', zIndex: 1000 }} 
                itemStyle={{ color: 'var(--foreground)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mb-6 border-b border-[var(--border)]/50 pb-4">
          {allCategoryData.map((entry, index) => {
            const isHidden = hiddenCategories.includes(entry.name);
            return (
              <button
                key={entry.name}
                onClick={() => toggleCategory(entry.name)}
                className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-opacity ${isHidden ? 'opacity-30 line-through' : 'opacity-100 hover:opacity-80'}`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="text-[var(--muted)]">{entry.name}</span>
              </button>
            )
          })}
        </div>
        
        {/* TOP PERFORMING / MOST VIEWED TOGGLE & COMPONENTS */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex bg-[var(--surface)] p-1 rounded-xl border border-[var(--border)] w-full">
            <button 
              onClick={() => setListType("sold")}
              className={`flex-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest py-1.5 rounded-lg transition-colors ${listType === "sold" ? "bg-[var(--foreground)] text-[var(--surface)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
            >
              Most Sold
            </button>
            <button 
              onClick={() => setListType("viewed")}
              className={`flex-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest py-1.5 rounded-lg transition-colors ${listType === "viewed" ? "bg-[var(--foreground)] text-[var(--surface)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
            >
              Most Viewed
            </button>
          </div>
        </div>

        {listType === "sold" ? (
          <TopSoldProducts orders={orders} physicalSales={physicalSales} products={products} />
        ) : (
          <MostViewedProducts products={products} />
        )}

      </div>

    </div>
  );
}