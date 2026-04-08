"use client";

const inputCls = "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] w-full appearance-none";
const labelCls = "text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--muted)] ml-0.5";

export default function GoldSpecsSection({ form, setField }) {
  return (
    <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
      <p className="text-[9px] font-black uppercase tracking-widest text-amber-600">Gold Details</p>
      <p className="text-[10px] text-[var(--muted)] opacity-70">
        Material is automatically set to "Gold" on the product page. Add weight and other details below.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className={labelCls}>Weight</label>
          <input
            type="text"
            value={form.weight || ""}
            onChange={setField("weight")}
            placeholder="e.g. 2.5 grams"
            className={inputCls}
          />
        </div>
      </div>

      <p className="text-[10px] text-[var(--muted)] opacity-60 italic">
        Tip: Use "Other Details" section below to add karat (e.g. 18K, 24K), purity, or other specifications.
      </p>
    </div>
  );
}
