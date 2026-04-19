"use client";

const inputCls = "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] w-full appearance-none";
const labelCls = "text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--muted)] ml-0.5";
const MOVEMENTS = ["Quartz", "Mechanical", "Automatic"];
const POWER_SOURCES = ["Battery", "Solar", "Kinetic", "Manual Wind"];

export default function WatchSpecsSection({ form, setField }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 space-y-4">
      <p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)]">Watch Technical Specs</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className={labelCls}>Case Size</label>
          <input value={form.caseSize} onChange={setField("caseSize")} placeholder="e.g. 40mm" className={inputCls} />
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
          <label className={labelCls}>Material</label>
          <input value={form.material || "Silicone"} onChange={setField("material")} placeholder="e.g. Silicone" className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className={labelCls}>Dial Color</label>
          <input value={form.dialColor} onChange={setField("dialColor")} placeholder="e.g. Green" className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className={labelCls}>Strap Color</label>
          <input value={form.strapColor} onChange={setField("strapColor")} className={inputCls} />
        </div>
      </div>
    </div>
  );
}
