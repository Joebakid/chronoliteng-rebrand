"use client";

import { memo, useCallback } from "react";

const inputCls = "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] w-full appearance-none shadow-sm";
const labelCls = "text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] ml-1";

/**
 * Sale Item Form - memoized for performance
 */
const SaleItemForm = memo(function SaleItemForm({
  item,
  index,
  productMap,
  canRemove,
  onUpdate,
  onRemove,
}) {
  // Handle product name change with auto-fill
  const handleProductNameChange = useCallback((e) => {
    const value = e.target.value;
    const updates = { productName: value };

    // Lookup product by name (O(1) with map)
    const product = productMap[value.toLowerCase()];
    if (product) {
      updates.unitPrice = String(product.price);
      updates.productId = product.id;
      updates.costPrice = product.costPrice || 0;
    }

    onUpdate(index, updates);
  }, [index, productMap, onUpdate]);

  // Handle field change
  const handleFieldChange = useCallback((field, value) => {
    onUpdate(index, { [field]: value });
  }, [index, onUpdate]);

  // Calculate subtotal
  const subtotal = (parseInt(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between">
        <p className={labelCls}>Item {index + 1}</p>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-[10px] font-bold uppercase text-red-400 hover:text-red-600 transition"
          >
            Remove
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}>Product Name</label>
        <input
          list={`product-list-${index}`}
          value={item.productName}
          onChange={handleProductNameChange}
          placeholder="e.g. Chronolite Elite"
          className={inputCls}
        />
        <datalist id={`product-list-${index}`}>
          {Object.values(productMap).map((p) => (
            <option key={p.id} value={p.name} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={labelCls}>Quantity</label>
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => handleFieldChange("quantity", e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Unit Price (NGN)</label>
          <input
            type="number"
            value={item.unitPrice}
            onChange={(e) => handleFieldChange("unitPrice", e.target.value)}
            placeholder="Auto-fills from catalogue"
            className={inputCls}
          />
        </div>
      </div>

      {item.productName && item.quantity && item.unitPrice && (
        <p className="text-[10px] font-bold text-[var(--accent)] px-1">
          Subtotal: ₦{subtotal.toLocaleString()}
        </p>
      )}
    </div>
  );
});

export default SaleItemForm;
