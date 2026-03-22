"use client";

const TABS = ["Products", "Walk-in", "In Transit", "Users", "Orders"];

export default function DashboardTabs({ activeTab, onChange, inTransitCount, walkInCount }) {
  return (
    <div className="flex gap-4 sm:gap-6 border-b border-[var(--border)] overflow-x-auto scrollbar-hide">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-[0.16em] transition border-b-2 -mb-px whitespace-nowrap ${
            activeTab === tab
              ? "border-[var(--foreground)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          {tab}

          {tab === "In Transit" && inTransitCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-sky-500 text-[9px] font-black text-white">
              {inTransitCount}
            </span>
          )}

          {tab === "Walk-in" && walkInCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-violet-500 text-[9px] font-black text-white">
              {walkInCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}