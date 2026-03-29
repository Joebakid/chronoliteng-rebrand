"use client";

const inputCls = "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] w-full appearance-none";
const labelCls = "text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--muted)] ml-0.5";

export default function PerfumeSpecsSection({ form, setField }) {
  return (
    <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 space-y-3">
      <p className="text-[9px] font-black uppercase tracking-widest text-sky-500">Perfume Specs</p>
      <div className="space-y-1">
        <label className={labelCls}>Size (mL)</label>
        <input value={form.perfumeSize} onChange={setField("perfumeSize")} placeholder="e.g. 100mL" className={inputCls} />
      </div>
    </div>
  );
}
