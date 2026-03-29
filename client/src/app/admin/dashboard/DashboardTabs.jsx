"use client";

const TABS = [
  { key: "Products", short: "Products" },
  { key: "Orders", short: "Orders" },
  { key: "Walk-in", short: "Walk-in" },
  { key: "In Transit", short: "Transit" },
  { key: "Promotions", short: "Promos" }, // Entry for your new Promotions tab
  { key: "Users", short: "Users" },
  { key: "Settings", short: "Settings" },
];

export default function DashboardTabs({
  activeTab,
  onChange,
  inTransitCount,
  walkInCount,
}) {
  return (
    <div className="w-full border-b border-[var(--border)]">
      <div className="flex overflow-x-auto no-scrollbar">
        {TABS.map(({ key, short }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`relative flex items-center justify-center gap-1.5 px-4 py-3 text-xs sm:text-sm font-bold uppercase tracking-[0.08em] sm:tracking-[0.12em] whitespace-nowrap transition border-b-2 ${
              activeTab === key
                ? "border-[var(--foreground)] text-[var(--foreground)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {/* Desktop label */}
            <span className="hidden sm:inline">{key}</span>

            {/* Mobile label */}
            <span className="sm:hidden">{short}</span>

            {/* Visual indicator for Promotions */}
            {key === "Promotions" && (
              <span className="text-[10px]">🎟️</span>
            )}

            {key === "In Transit" && inTransitCount > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-sky-500 text-[9px] font-black text-white leading-none">
                {inTransitCount}
              </span>
            )}

            {key === "Walk-in" && walkInCount > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-violet-500 text-[9px] font-black text-white leading-none">
                {walkInCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}