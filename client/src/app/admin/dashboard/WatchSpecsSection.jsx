"use client";

import { useState } from "react";

const inputCls = "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] w-full appearance-none";
const labelCls = "text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--muted)] ml-0.5";

const MOVEMENTS = ["Quartz", "Mechanical", "Automatic"];
const POWER_SOURCES = ["Battery", "Solar", "Kinetic", "Manual Wind"];
const MATERIALS = [
  "Silicone", "Leather", "Stainless Steel", "Rubber",
  "Titanium", "Ceramic", "Canvas", "Gold Plated"
];
const CONTAINERS = ["Box Only", "Box & Papers", "Papers Only", "No Box"];

export default function WatchSpecsSection({ form, setField }) {
  const [enabled, setEnabled] = useState(true);

  const handleToggle = () => {
    if (enabled) {
      // Clear all fields when removing so they don't save to DB
      setField("caseSize")({ target: { value: "" } });
      setField("movement")({ target: { value: "" } });
      setField("powerSource")({ target: { value: "" } });
      setField("material")({ target: { value: "" } });
      setField("dialColor")({ target: { value: "" } });
      setField("strapColor")({ target: { value: "" } });
      setField("watchContainer")({ target: { value: "" } });
    }
    setEnabled((prev) => !prev);
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 space-y-4">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)]">
          Watch Technical Specs
        </p>
        <button
          type="button"
          onClick={handleToggle}
          className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)] hover:text-red-400 transition"
        >
          {enabled ? "— Remove" : "+ Add"}
        </button>
      </div>

      {/* Fields — only shown when enabled */}
      {enabled && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelCls}>Case Size</label>
            <input
              value={form.caseSize}
              onChange={setField("caseSize")}
              placeholder="e.g. 40mm"
              className={inputCls}
            />
          </div>

          <div className="space-y-1">
            <label className={labelCls}>Movement</label>
            <select value={form.movement} onChange={setField("movement")} className={inputCls}>
              {MOVEMENTS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className={labelCls}>Power Source</label>
            <select value={form.powerSource} onChange={setField("powerSource")} className={inputCls}>
              {POWER_SOURCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className={labelCls}>Strap Material</label>
            <select
              value={form.material || "Silicone"}
              onChange={setField("material")}
              className={inputCls}
            >
              {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className={labelCls}>Dial Color</label>
            <input
              value={form.dialColor}
              onChange={setField("dialColor")}
              placeholder="e.g. Green"
              className={inputCls}
            />
          </div>

          <div className="space-y-1">
            <label className={labelCls}>Strap Color</label>
            <input
              value={form.strapColor}
              onChange={setField("strapColor")}
              placeholder="e.g. Black"
              className={inputCls}
            />
          </div>

          <div className="space-y-1 col-span-2">
            <label className={labelCls}>Watch Container</label>
            <select
              value={form.watchContainer || "Box Only"}
              onChange={setField("watchContainer")}
              className={inputCls}
            >
              {CONTAINERS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}