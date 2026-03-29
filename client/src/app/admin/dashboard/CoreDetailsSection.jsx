"use client";

const inputCls = "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] w-full appearance-none";
const labelCls = "text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--muted)] ml-0.5";

const fmt = (n) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

export default function CoreDetailsSection({ form, setField, categories }) {
  const profitPreview = (() => {
    if (!form.price || !form.costPrice) return null;
    const profit = Number(form.price) - Number(form.costPrice);
    const margin = ((profit / Number(form.costPrice)) * 100).toFixed(1);
    return { profit, margin, isProfit: profit >= 0 };
  })();

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]/30 p-4">
      <p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)]">Core Details</p>

      <div className="space-y-1">
        <label className={labelCls}>Name</label>
        <input value={form.name} onChange={setField("name")} placeholder="Product name" required className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className={labelCls}>Category</label>
          <select value={form.category} onChange={setField("category")} className={inputCls}>
            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className={labelCls}>Brand</label>
          <input value={form.collection} onChange={setField("collection")} placeholder="Brand" className={inputCls} />
        </div>
      </div>

      <div className="space-y-1">
        <label className={labelCls}>Description</label>
        <textarea value={form.description} onChange={setField("description")} placeholder="Product description..." rows={3} className={`${inputCls} resize-none`} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className={labelCls}>Price (₦)</label>
          <input type="number" value={form.price} onChange={setField("price")} required className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className={labelCls}>Cost (₦)</label>
          <input type="number" value={form.costPrice} onChange={setField("costPrice")} className={inputCls} />
        </div>
      </div>

      {profitPreview && (
        <div className={`flex items-center justify-between rounded-xl px-3 py-2 border text-xs ${profitPreview.isProfit ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600" : "bg-red-500/5 border-red-500/20 text-red-500"}`}>
          <span className="font-black uppercase text-[10px]">{profitPreview.isProfit ? "▲ Profit" : "▼ Loss"}</span>
          <span className="font-bold">{fmt(profitPreview.profit)} ({profitPreview.margin}%)</span>
        </div>
      )}
    </div>
  );
}
