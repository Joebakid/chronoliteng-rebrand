"use client";

const TABS = [
  { key: "Products",   short: "Products" },
  { key: "Walk-in",    short: "Walk-in"  },
  { key: "In Transit", short: "Transit"  },
  { key: "Users",      short: "Users"    },
  { key: "Orders",     short: "Orders"   },
];

export default function DashboardTabs({ activeTab, onChange, inTransitCount, walkInCount }) {
  return (
    <nav className="relative w-full border-b border-[var(--border)] bg-[var(--background)]">
      <div
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        style={{ 
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none' // IE/Edge
        }}
      >
        {TABS.map(({ key, short }) => {
          const isActive = activeTab === key;
          
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              // Added snap-start for better mobile scrolling behavior
              className={`relative flex-1 min-w-[80px] sm:min-w-fit snap-start flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 pb-3 pt-3 px-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-px whitespace-nowrap ${
                isActive
                  ? "border-[var(--foreground)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {/* Responsive Text */}
              <span className="hidden sm:inline">{key}</span>
              <span className="sm:hidden">{short}</span>

              {/* Badge Logic */}
              {((key === "In Transit" && inTransitCount > 0) || (key === "Walk-in" && walkInCount > 0)) && (
                <span 
                  className={`
                    sm:static absolute top-2 right-2 sm:right-auto sm:top-auto
                    inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full 
                    text-[9px] font-black text-white leading-none
                    ${key === "In Transit" ? "bg-sky-500" : "bg-violet-500"}
                  `}
                >
                  {key === "In Transit" ? inTransitCount : walkInCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}