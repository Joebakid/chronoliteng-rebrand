"use client";

import { useState, useCallback, useMemo, memo } from "react";
import SaleItemForm from "./SaleItemForm";

// Reduced padding slightly for better mobile fit
const inputCls = "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] w-full appearance-none shadow-sm";
const labelCls = "text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--muted)] ml-1";

const emptyItem = () => ({ productName: "", quantity: 1, unitPrice: "" });

const SaleForm = memo(function SaleForm({ products, costMap, submitting, onSubmit }) {
  const [form, setForm] = useState({ amountPaid: "", notes: "", items: [emptyItem()] });
  const [error, setError] = useState("");

  const productMap = useMemo(() => {
    const map = {};
    for (const p of products) map[p.name.toLowerCase()] = p;
    return map;
  }, [products]);

  const updateItem = useCallback((index, updates) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], ...updates };
      let total = 0;
      for (const it of items) total += (parseInt(it.quantity, 10) || 0) * (parseFloat(it.unitPrice) || 0);
      return { ...prev, items, amountPaid: total > 0 ? String(total) : prev.amountPaid };
    });
  }, []);

  const addItem = useCallback(() => setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] })), []);
  const removeItem = useCallback((index) => setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) })), []);
  const updateField = useCallback((field, value) => setForm((prev) => ({ ...prev, [field]: value })), []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError("");
    if (!form.amountPaid || parseFloat(form.amountPaid) <= 0) {
      setError("Enter valid amount");
      return;
    }
    const validItems = form.items.filter((it) => it.productName.trim());
    if (validItems.length === 0) {
      setError("Add at least one item");
      return;
    }
    const payload = {
      total: parseFloat(form.amountPaid),
      notes: form.notes,
      items: validItems.map((it) => ({
        name: it.productName.trim(),
        quantity: parseInt(it.quantity, 10) || 1,
        price: parseFloat(it.unitPrice) || 0,
        productId: it.productId || null,
        costPrice: it.costPrice || 0,
      })),
    };
    try {
      await onSubmit(payload);
      setForm({ amountPaid: "", notes: "", items: [emptyItem()] });
    } catch (err) {
      setError("Failed to save");
    }
  }, [form, onSubmit]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Record Walk-in Sale</h2>
        {error && <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full text-red-500 bg-red-500/10 border border-red-500/20">{error}</span>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Items Container - reduced padding from p-5 to p-3 */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]/30 p-3 sm:p-5 shadow-sm space-y-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)] px-1">Items Sold</p>
          {form.items.map((item, i) => (
            <SaleItemForm
              key={i}
              item={item}
              index={i}
              productMap={productMap}
              canRemove={form.items.length > 1}
              onUpdate={updateItem}
              onRemove={removeItem}
            />
          ))}
          <button type="button" onClick={addItem} className="w-full rounded-xl border border-dashed border-[var(--border)] py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition">
            + Add Another Item
          </button>
        </div>

        {/* Payment Container */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]/30 p-3 sm:p-5 shadow-sm space-y-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)] px-1">Payment & Notes</p>
          <div className="space-y-1">
            <label className={labelCls}>Amount Paid (NGN)</label>
            <input type="number" value={form.amountPaid} onChange={(e) => updateField("amountPaid", e.target.value)} placeholder="0.00" required className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Notes</label>
            <textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} rows={2} placeholder="e.g. Paid cash..." className={`${inputCls} resize-none`} />
          </div>
        </div>

        <button disabled={submitting} className="w-full rounded-xl bg-[var(--foreground)] py-3.5 text-xs font-bold uppercase tracking-widest text-[var(--surface-strong)] shadow-lg transition active:scale-[0.98] disabled:opacity-50">
          {submitting ? "Saving..." : "Record Sale"}
        </button>
      </form>
    </div>
  );
});

export default SaleForm;