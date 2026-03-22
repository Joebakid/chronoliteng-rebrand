"use client";

const fmt = (n) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

export default function DashboardProfitCard({ netProfit, loading }) {
  const isProfit = netProfit !== null && netProfit >= 0;

  return (
    <div className={`rounded-[1.5rem] sm:rounded-2xl border p-4 sm:p-5 shadow-sm flex flex-col justify-between gap-3 ${
      loading || netProfit === null
        ? "border-[var(--border)] bg-[var(--surface-strong)]"
        : isProfit
        ? "border-emerald-500/25 bg-emerald-500/5"
        : "border-red-500/25 bg-red-500/5"
    }`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Net Profit / Loss
        </p>
        {!loading && netProfit !== null && (
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 border text-[9px] font-black uppercase tracking-widest ${
            isProfit
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
              : "bg-red-500/10 border-red-500/20 text-red-500"
          }`}>
            <span>{isProfit ? "▲" : "▼"}</span>
            <span>{isProfit ? "In Profit" : "At a Loss"}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-8 w-36 rounded-lg bg-[var(--border)] animate-pulse" />
      ) : netProfit === null ? (
        <p className="text-sm text-[var(--muted)]">
          Add cost prices to products to track P&amp;L
        </p>
      ) : (
        <p className={`text-2xl sm:text-3xl font-black tabular-nums ${isProfit ? "text-emerald-500" : "text-red-500"}`}>
          {isProfit ? "+" : "−"}{fmt(Math.abs(netProfit))}
        </p>
      )}
    </div>
  );
}