"use client";

import { useState, useEffect } from "react";
import { createPhysicalSale, getPhysicalSales, deletePhysicalSale } from "@/lib/api";

const fmt = (n) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

const fmtDate = (value) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const emptyItem = () => ({ productName: "", quantity: 1, unitPrice: "" });

const inputCls =
  "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] w-full appearance-none shadow-sm";
const labelCls =
  "text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] ml-1";

export default function PhysicalSalesTab({ products = [], onSaleRecorded }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [form, setForm] = useState({
    amountPaid: "",
    notes: "",
    items: [emptyItem()],
  });

  useEffect(() => { fetchSales(); }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const data = await getPhysicalSales();
      setSales(data);
    } catch (err) {
      console.error("[PhysicalSalesTab] fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const setField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const setItemField = (index, key) => (e) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [key]: e.target.value };

      if (key === "productName") {
        const match = products.find(
          (p) => p.name.toLowerCase() === e.target.value.toLowerCase()
        );
        if (match) items[index].unitPrice = String(match.price);
      }

      const total = items.reduce((sum, it) => {
        return sum + (parseInt(it.quantity, 10) || 0) * (parseFloat(it.unitPrice) || 0);
      }, 0);

      return { ...prev, items, amountPaid: total > 0 ? String(total) : prev.amountPaid };
    });
  };

  const addItem = () =>
    setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));

  const removeItem = (index) =>
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amountPaid || parseFloat(form.amountPaid) <= 0) return;
    setSubmitting(true);
    try {
      await createPhysicalSale({
        total: parseFloat(form.amountPaid),
        notes: form.notes,
        items: form.items
          .filter((it) => it.productName.trim())
          .map((it) => ({
            name: it.productName.trim(),
            quantity: parseInt(it.quantity, 10) || 1,
            price: parseFloat(it.unitPrice) || 0,
          })),
      });
      await fetchSales();
      if (onSaleRecorded) onSaleRecorded();
      setForm({ amountPaid: "", notes: "", items: [emptyItem()] });
      setSuccessMsg("Saved to Firebase ✓");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("[PhysicalSalesTab] save error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePhysicalSale(id);
      await fetchSales();
      if (onSaleRecorded) onSaleRecorded();
    } catch (err) {
      console.error("[PhysicalSalesTab] delete error:", err);
    }
  };

  const totalRevenue = sales.reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_420px] lg:items-start">

      {/* ── Left: Form ── */}
      <div className="order-1 lg:sticky lg:top-24 space-y-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--muted)]">Record Walk-in Sale</h2>
          {successMsg && (
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              {successMsg}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Items */}
          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)]/30 p-5 shadow-sm space-y-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)] px-1">Items Sold</p>

            {form.items.map((item, i) => (
              <div key={i} className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex items-center justify-between">
                  <p className={labelCls}>Item {i + 1}</p>
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-[10px] font-bold uppercase text-red-400 hover:text-red-600 transition">
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className={labelCls}>Product Name</label>
                  <input
                    list={`product-list-${i}`}
                    value={item.productName}
                    onChange={setItemField(i, "productName")}
                    placeholder="e.g. Chronolite Elite"
                    className={inputCls}
                  />
                  <datalist id={`product-list-${i}`}>
                    {products.map((p) => <option key={p.id} value={p.name} />)}
                  </datalist>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={labelCls}>Quantity</label>
                    <input type="number" min="1" value={item.quantity} onChange={setItemField(i, "quantity")} className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Unit Price (NGN)</label>
                    <input type="number" value={item.unitPrice} onChange={setItemField(i, "unitPrice")} placeholder="Auto-fills from catalogue" className={inputCls} />
                  </div>
                </div>

                {item.productName && item.quantity && item.unitPrice && (
                  <p className="text-[10px] font-bold text-[var(--accent)] px-1">
                    Subtotal: {fmt((parseInt(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0))}
                  </p>
                )}
              </div>
            ))}

            <button type="button" onClick={addItem} className="w-full rounded-2xl border border-dashed border-[var(--border)] py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition">
              + Add Another Item
            </button>
          </div>

          {/* Payment & Notes */}
          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)]/30 p-5 shadow-sm space-y-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)] px-1">Payment & Notes</p>

            <div className="space-y-1.5">
              <label className={labelCls}>Amount Paid (NGN)</label>
              <input type="number" value={form.amountPaid} onChange={setField("amountPaid")} placeholder="Auto-calculated from items above" required className={inputCls} />
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Notes / Memo (optional)</label>
              <textarea value={form.notes} onChange={setField("notes")} rows={2} placeholder="e.g. Paid cash, gave small discount..." className={`${inputCls} rounded-2xl resize-none`} />
            </div>
          </div>

          <button disabled={submitting} className="w-full rounded-full bg-[var(--foreground)] py-4 text-sm font-bold uppercase tracking-widest text-[var(--surface-strong)] shadow-2xl transition active:scale-95 disabled:opacity-50">
            {submitting ? "Saving to Firebase..." : "Record Sale"}
          </button>
        </form>
      </div>

      {/* ── Right: History ── */}
      <div className="order-2 space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-[var(--muted)]">Walk-in History</h2>
          <span className="text-[10px] font-bold text-[var(--accent)]">
            {sales.length} sale{sales.length !== 1 ? "s" : ""} · {fmt(totalRevenue)}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4 space-y-3 animate-pulse">
                <div className="h-4 w-24 rounded-lg bg-[var(--border)]" />
                <div className="h-4 w-full rounded-lg bg-[var(--border)]" />
                <div className="h-4 w-1/2 rounded-lg bg-[var(--border)]" />
              </div>
            ))}
          </div>
        ) : sales.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[var(--border)] py-20 text-center space-y-2">
            <p className="text-2xl">🏪</p>
            <p className="text-sm text-[var(--muted)]">No walk-in sales yet.</p>
            <p className="text-[11px] text-[var(--muted)] opacity-60">Record your first physical sale using the form.</p>
          </div>
        ) : (
          sales.map((sale) => (
            <div key={sale.id} className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20">Walk-in</span>
                  <p className="text-[10px] text-[var(--muted)] mt-1.5 uppercase tracking-tight">{fmtDate(sale.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-black text-[var(--accent)]">{fmt(sale.total)}</p>
                  <button onClick={() => handleDelete(sale.id)} className="text-[10px] font-bold uppercase text-red-400 hover:text-red-600 transition px-2 py-1 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100">
                    Del
                  </button>
                </div>
              </div>

              {sale.items?.length > 0 && (
                <div className="space-y-1.5">
                  {sale.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-[var(--surface)] px-3 py-2">
                      <p className="text-xs font-bold truncate">{item.name}</p>
                      <p className="text-[10px] text-[var(--muted)] flex-shrink-0 ml-2">{fmt(item.price)} × {item.quantity}</p>
                    </div>
                  ))}
                </div>
              )}

              {sale.notes && (
                <p className="text-[11px] text-[var(--muted)] italic border-t border-[var(--border)]/50 pt-2">"{sale.notes}"</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}