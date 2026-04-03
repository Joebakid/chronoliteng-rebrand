"use client";

import { useState, useEffect } from "react";

const fmt = (n) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getMonthStats(orders = [], physicalSales = [], year, month) {
  const inMonth = (o) => {
    const d = new Date(o.createdAt);
    return d.getFullYear() === year && d.getMonth() === month;
  };
  const online = orders.filter(inMonth);
  const physical = physicalSales.filter(inMonth);
  return {
    count: online.length + physical.length,
    revenue:
      online.reduce((s, o) => s + (o.total || 0), 0) +
      physical.reduce((s, o) => s + (o.total || 0), 0),
    onlineCount: online.length,
    physicalCount: physical.length,
  };
}

function buildMonthOptions() {
  const now = new Date();
  const options = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return options;
}

export default function DashboardMonthCard({
  orders = [],
  physicalSales = [],
  loading = false,
  // These props are called whenever the user changes the dropdown
  // so AdminDashboardClient can keep its profit card in sync
  onMonthChange,
  onYearChange,
}) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  // On mount, immediately tell the parent what month we're showing
  // so the profit card is correct from the very first render
  useEffect(() => {
    onMonthChange?.(now.getMonth());
    onYearChange?.(now.getFullYear());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-advance when the calendar month flips (e.g. tab left open overnight)
  useEffect(() => {
    const checkMonth = () => {
      const n = new Date();
      if (n.getMonth() !== selectedMonth || n.getFullYear() !== selectedYear) {
        setSelectedMonth(n.getMonth());
        setSelectedYear(n.getFullYear());
        onMonthChange?.(n.getMonth());
        onYearChange?.(n.getFullYear());
      }
    };
    const interval = setInterval(checkMonth, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, [selectedMonth, selectedYear, onMonthChange, onYearChange]);

  const monthOptions = buildMonthOptions();
  const selected = getMonthStats(orders, physicalSales, selectedYear, selectedMonth);

  const prevDate = new Date(selectedYear, selectedMonth - 1, 1);
  const prev = getMonthStats(orders, physicalSales, prevDate.getFullYear(), prevDate.getMonth());

  const revenueChange =
    prev.revenue > 0
      ? (((selected.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1)
      : null;
  const ordersChange =
    prev.count > 0
      ? (((selected.count - prev.count) / prev.count) * 100).toFixed(1)
      : null;

  const revenueUp = revenueChange !== null && parseFloat(revenueChange) >= 0;
  const ordersUp = ordersChange !== null && parseFloat(ordersChange) >= 0;

  const handleSelect = (e) => {
    const [y, m] = e.target.value.split("-").map(Number);
    setSelectedYear(y);
    setSelectedMonth(m);
    // Keep parent in sync so the profit card updates immediately
    onMonthChange?.(m);
    onYearChange?.(y);
  };

  return (
    <div className="rounded-[1.5rem] sm:rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 sm:p-5 shadow-sm space-y-3">

      {/* Header with month dropdown */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[var(--muted)] shrink-0">
          Sales
        </p>
        <select
          value={`${selectedYear}-${selectedMonth}`}
          onChange={handleSelect}
          className="text-[10px] font-black uppercase tracking-wider rounded-full bg-[var(--surface)] border border-[var(--border)] px-3 py-1 text-[var(--foreground)] outline-none cursor-pointer hover:border-[var(--accent)] transition"
        >
          {monthOptions.map(({ year, month }) => (
            <option key={`${year}-${month}`} value={`${year}-${month}`}>
              {MONTH_NAMES[month]} {year}
              {year === now.getFullYear() && month === now.getMonth() ? " · Current" : ""}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-8 w-36 rounded-lg bg-[var(--border)] animate-pulse" />
          <div className="h-4 w-24 rounded-lg bg-[var(--border)] animate-pulse" />
        </div>
      ) : (
        <>
          <div>
            <p className="text-2xl sm:text-3xl font-black tabular-nums">
              {fmt(selected.revenue)}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs text-[var(--muted)]">
                {selected.count} order{selected.count !== 1 ? "s" : ""}
              </p>
              {selected.physicalCount > 0 && (
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20">
                  {selected.physicalCount} walk-in
                </span>
              )}
            </div>
          </div>

          {/* vs previous month */}
          <div className="flex flex-wrap gap-2">
            {revenueChange !== null && (
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider border ${
                revenueUp
                  ? "bg-emerald-500/8 border-emerald-500/20 text-emerald-600"
                  : "bg-red-500/8 border-red-500/20 text-red-500"
              }`}>
                {revenueUp ? "▲" : "▼"} {revenueUp ? "+" : ""}{revenueChange}% vs {MONTH_NAMES[prevDate.getMonth()]}
              </span>
            )}
            {ordersChange !== null && (
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider border ${
                ordersUp
                  ? "bg-emerald-500/8 border-emerald-500/20 text-emerald-600"
                  : "bg-red-500/8 border-red-500/20 text-red-500"
              }`}>
                {ordersUp ? "▲" : "▼"} {ordersUp ? "+" : ""}{ordersChange}% orders
              </span>
            )}
            {revenueChange === null && ordersChange === null && (
              <span className="text-[10px] text-[var(--muted)]">No prior month data to compare</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}