"use client";

const fmt = (n) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

export default function DashboardStats({
  analytics = {},
  products = [],
  physicalSales = [],
  fetching = true,
  // We add these new props to receive the filtered month data
  selectedMonthStats = null 
}) {
  // If we have selectedMonthStats (from the MonthCard), use those. 
  // Otherwise, fallback to 0 instead of lifetime totals.
  const revenue = selectedMonthStats ? selectedMonthStats.revenue : 0;
  const orders = selectedMonthStats ? selectedMonthStats.count : 0;
  const itemsSold = selectedMonthStats ? selectedMonthStats.itemsSold : 0;
  const walkInCount = selectedMonthStats ? selectedMonthStats.physicalCount : 0;

  const stats = [
    {
      label: "Products",
      value: fetching ? null : products.length,
    },
    {
      label: "Orders",
      value: fetching ? null : (
        <span className="flex items-baseline gap-1.5 flex-wrap">
          {orders}
          {walkInCount > 0 && (
            <span className="text-[10px] font-bold text-violet-500 normal-case tracking-normal">
              ({walkInCount} walk-in)
            </span>
          )}
        </span>
      ),
    },
    {
      label: "Revenue",
      value: fetching ? null : fmt(revenue),
    },
    {
      label: "Items Sold",
      value: fetching ? null : itemsSold,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:gap-4 xl:grid-cols-4">
      {stats.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-[1.5rem] sm:rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 sm:p-5 shadow-sm"
        >
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[var(--muted)] truncate">
            {label}
          </p>
          {value === null ? (
            <div className="mt-2 h-7 w-16 rounded-lg bg-[var(--border)] animate-pulse" />
          ) : (
            <p className="mt-2 text-xl sm:text-2xl font-semibold tabular-nums">{value}</p>
          )}
        </div>
      ))}
    </div>
  );
}