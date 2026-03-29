"use client";

const inputCls = "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] w-full appearance-none";

export default function InTransitSection({ form, setField, setToggle }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]/30 p-4">
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={form.inTransit} onChange={setToggle("inTransit")} className="sr-only" />
        <div className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${form.inTransit ? "bg-sky-500" : "bg-[var(--border)]"}`}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.inTransit ? "translate-x-5" : "translate-x-0.5"}`} />
        </div>
        <div>
          <span className="text-sm font-bold block">In Transit</span>
          <span className="text-[10px] text-[var(--muted)]">Mark if product is on its way</span>
        </div>
      </label>
      {form.inTransit && (
        <input value={form.transitNote} onChange={setField("transitNote")} placeholder="Transit notes, ETA, tracking info..." className={`${inputCls} mt-3`} />
      )}
    </div>
  );
}
