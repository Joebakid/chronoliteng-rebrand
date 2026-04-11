"use client";

import { useState, useCallback, useMemo, memo } from "react";
import SaleItemForm from "./SaleItemForm";

const inputCls = "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] w-full appearance-none shadow-sm";
const labelCls = "text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] ml-1";

const emptyItem = () => ({ productName: "", quantity: 1, unitPrice: "" });

/**
 * Sale Form - optimized with memoization and stable callbacks
 */
const SaleForm = memo(function SaleForm({
  products,
  costMap,
  submitting,
  onSubmit,
}) {
  const [form, setForm] = useState({
    amountPaid: "",
    notes: "",
    items: [emptyItem()],
  });
  const [error, setError] = useState("");

  // Build product lookup map once
  const productMap = useMemo(() => {
    const map = {};
    for (const p of products) {
      map[p.name.toLowerCase()] = p;
    }
    return map;
  }, [products]);

  // Update item - stable callback
  const updateItem = useCallback((index, updates) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], ...updates };

      // Recalculate total
      let total = 0;
      for (const it of items) {
        total += (parseInt(it.quantity, 10) || 0) * (parseFloat(it.unitPrice) || 0);
      }

      return {
        ...prev,
        items,
        amountPaid: total > 0 ? String(total) : prev.amountPaid,
      };
    });
  }, []);

  // Add item - stable callback
  const addItem = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, emptyItem()],
    }));
  }, []);

  // Remove item - stable callback
  const removeItem = useCallback((index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  // Update field - stable callback
  const updateField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Handle submit - stable callback
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError("");

    if (!form.amountPaid || parseFloat(form.amountPaid) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const validItems = form.items.filter((it) => it.productName.trim());
    if (validItems.length === 0) {
      setError("Please add at least one item with a product name");
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
      setError("Failed to save sale");
    }
  }, [form, onSubmit]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
          Record Walk-in Sale
        </h2>
        {error && (
          <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full text-red-600 bg-red-500/10 border border-red-500/20">
            {error}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Items */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]/30 p-5 shadow-sm space-y-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)] px-1">
            Items Sold
          </p>

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

          <button
            type="button"
            onClick={addItem}
            className="w-full rounded-2xl border border-dashed border-[var(--border)] py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition"
          >
            + Add Another Item
          </button>
        </div>

        {/* Payment & Notes */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]/30 p-5 shadow-sm space-y-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)] px-1">
            Payment & Notes
          </p>

          <div className="space-y-1.5">
            <label className={labelCls}>Amount Paid (NGN)</label>
            <input
              type="number"
              value={form.amountPaid}
              onChange={(e) => updateField("amountPaid", e.target.value)}
              placeholder="Auto-calculated from items above"
              required
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Notes / Memo (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={2}
              placeholder="e.g. Paid cash, gave small discount..."
              className={`${inputCls} rounded-2xl resize-none`}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          disabled={submitting}
          className="w-full rounded-full bg-[var(--foreground)] py-4 text-sm font-bold uppercase tracking-widest text-[var(--surface-strong)] shadow-2xl transition active:scale-95 disabled:opacity-50"
        >
          {submitting ? "Saving to Firebase..." : "Record Sale"}
        </button>
      </form>
    </div>
  );
});

export default SaleForm;
