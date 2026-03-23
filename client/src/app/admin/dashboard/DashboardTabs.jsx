"use client";

const TABS = [
  { key: "Products",   short: "Products"  },
  { key: "Walk-in",    short: "Walk-in"   },
  { key: "In Transit", short: "Transit"   },
  { key: "Users",      short: "Users"     },
  { key: "Orders",     short: "Orders"    },
  { key: "Settings",   short: "Settings"  },
];

export default function DashboardTabs({ activeTab, onChange, inTransitCount, walkInCount }) {
  return (
    <div
      className="flex border-b border-[var(--border)] overflow-x-auto scrollbar-hide gap-0"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {TABS.map(({ key, short }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`relative flex-1 min-w-fit flex items-center justify-center gap-1.5 pb-3 pt-1 px-3 text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] sm:tracking-[0.16em] transition border-b-2 -mb-px whitespace-nowrap ${
            activeTab === key
              ? "border-[var(--foreground)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <span className="hidden sm:inline">{key}</span>
          <span className="sm:hidden">{short}</span>

          {key === "In Transit" && inTransitCount > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-sky-500 text-[9px] font-black text-white leading-none">
              {inTransitCount}
            </span>
          )}
          {key === "Walk-in" && walkInCount > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-violet-500 text-[9px] font-black text-white leading-none">
              {walkInCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}