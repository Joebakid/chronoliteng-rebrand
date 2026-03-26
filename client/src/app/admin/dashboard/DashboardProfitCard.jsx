"use client";

/**
 * Formatter for Nigerian Naira
 * Sets maximumFractionDigits to 0 for a cleaner look (e.g., ₦10,000)
 */
const fmt = (n) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

export default function DashboardProfitCard({ netProfit, loading }) {
  // If netProfit is null or undefined, we default to 0 (or the revenue value).
  // This ensures the card shows a profit state even if costs weren't added.
  const displayValue = netProfit ?? 0;
  const isProfit = displayValue >= 0;

  return (
    <div
      className={`rounded-[1.5rem] sm:rounded-2xl border p-4 sm:p-5 shadow-sm flex flex-col justify-between gap-3 transition-all duration-300 ${
        loading
          ? "border-[var(--border)] bg-[var(--surface-strong)]"
          : isProfit
          ? "border-emerald-500/25 bg-emerald-500/5"
          : "border-red-500/25 bg-red-500/5"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[var(--muted)] font-medium">
          Net Profit / Loss
        </p>
        
        {!loading && (
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 border text-[9px] font-black uppercase tracking-widest ${
              isProfit
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                : "bg-red-500/10 border-red-500/20 text-red-500"
            }`}
          >
            <span>{isProfit ? "▲" : "▼"}</span>
            <span>{isProfit ? "In Profit" : "At a Loss"}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {loading ? (
          <div className="h-9 w-36 rounded-lg bg-[var(--border)] animate-pulse" />
        ) : (
          <p
            className={`text-2xl sm:text-3xl font-black tabular-nums tracking-tight ${
              isProfit ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {/* Using Math.abs ensures we don't get "--10,000" if the value is negative */}
            {isProfit ? "+" : "−"}{fmt(Math.abs(displayValue))}
          </p>
        )}
        
        {!loading && netProfit === null && (
          <p className="text-[10px] text-emerald-600/70 font-medium">
            Assuming 100% margin (No cost price added)
          </p>
        )}
      </div>
    </div>
  );
}