"use client";

/**
 * Formatter for Nigerian Naira
 */
const fmt = (n) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

export default function DashboardProfitCard({ netProfit, loading, totalSalesCount = 0 }) {
  // If there are literally 0 sales, profit MUST be 0 regardless of what the DB says
  // This prevents "Ghost Profit" from all-time data appearing in a monthly view
  const displayValue = totalSalesCount === 0 ? 0 : (netProfit ?? 0);
  
  const isProfit = displayValue > 0;
  const isLoss = displayValue < 0;
  const isZero = displayValue === 0;

  return (
    <div
      className={`rounded-[1.5rem] sm:rounded-2xl border p-4 sm:p-5 shadow-sm flex flex-col justify-between gap-3 transition-all duration-300 ${
        loading
          ? "border-[var(--border)] bg-[var(--surface-strong)]"
          : isLoss
          ? "border-red-500/25 bg-red-500/5"
          : isProfit
          ? "border-emerald-500/25 bg-emerald-500/5"
          : "border-[var(--border)] bg-[var(--surface-strong)]" 
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[var(--muted)] font-medium">
          Net Profit / Loss
        </p>
        
        {!loading && (
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 border text-[9px] font-black uppercase tracking-widest ${
              isLoss
                ? "bg-red-500/10 border-red-500/20 text-red-500"
                : isProfit
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                : "bg-white/5 border-white/10 text-[var(--muted)]"
            }`}
          >
            <span>{isLoss ? "▼" : isProfit ? "▲" : "○"}</span>
            <span>{isLoss ? "At a Loss" : isProfit ? "In Profit" : "No Activity"}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {loading ? (
          <div className="h-9 w-36 rounded-lg bg-[var(--border)] animate-pulse" />
        ) : (
          <p
            className={`text-2xl sm:text-3xl font-black tabular-nums tracking-tight ${
              isLoss ? "text-red-500" : isProfit ? "text-emerald-500" : "text-white"
            }`}
          >
            {isProfit && "+"}
            {isLoss && "−"}
            {fmt(Math.abs(displayValue))}
          </p>
        )}
        
        {!loading && isZero && (
          <p className="text-[10px] text-[var(--muted)] font-medium">
            No sales recorded for this period
          </p>
        )}
      </div>
    </div>
  );
}