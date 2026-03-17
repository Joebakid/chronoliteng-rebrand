"use client";

export default function RequestForm({ form, onChange, image, onUpload, onSubmit, submitting }) {
  const REQUEST_TYPES = [
    { value: "product_request", label: "Product Sourcing" },
    { value: "distributor", label: "Distribution Inquiry" },
    { value: "general_support", label: "General Support" },
  ];

  return (
    <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-4">
      <div className="flex-1 space-y-1.5">
        <label className="text-[0.6rem] font-black uppercase text-[var(--muted)] ml-2">Topic</label>
        <select
          value={form.type}
          onChange={(e) => onChange({ ...form, type: e.target.value })}
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none"
        >
          {REQUEST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <textarea
        rows={3}
        value={form.message}
        onChange={(e) => onChange({ ...form, message: e.target.value })}
        placeholder="Type your message here..."
        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm outline-none focus:ring-1 ring-[var(--accent)]"
      />
      <div className="flex items-center justify-between">
        <button onClick={onUpload} className="text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)]">
          {image ? "✓ Photo Attached" : "+ Add Photo"}
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting || !form.message}
          className="rounded-full bg-[var(--accent)] px-8 py-3 text-xs font-bold text-white disabled:opacity-50 transition"
        >
          {submitting ? "Sending..." : "Create Request"}
        </button>
      </div>
    </div>
  );
}