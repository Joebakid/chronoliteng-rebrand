"use client";

const inputCls = "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] w-full appearance-none";

export default function CustomFieldsSection({ customFields, onAdd, onRemove, onUpdate }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--muted)]">Other Details</p>
        <button type="button" onClick={onAdd} className="text-[10px] font-bold text-[var(--accent)]">+ Add Detail</button>
      </div>

      {customFields.length === 0 && (
        <p className="text-[10px] text-[var(--muted)] text-center py-2 opacity-60">
          Add custom specs like water resistance, warranty, etc.
        </p>
      )}

      {customFields.map((field, index) => (
        <div key={index} className="flex gap-2 items-center">
          <input placeholder="Label" value={field.label} onChange={(e) => onUpdate(index, "label", e.target.value)} className={`${inputCls} text-[10px] h-9`} />
          <input placeholder="Value" value={field.value} onChange={(e) => onUpdate(index, "value", e.target.value)} className={`${inputCls} text-[10px] h-9`} />
          <button type="button" onClick={() => onRemove(index)} className="w-8 h-9 flex-shrink-0 flex items-center justify-center rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors text-lg">×</button>
        </div>
      ))}
    </div>
  );
}
