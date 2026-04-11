"use client";

import { useState, useCallback } from "react";

const emptyItem = () => ({ productName: "", quantity: 1, unitPrice: "" });

/**
 * Hook for handling product autocomplete in sale item forms
 */
export function useProductAutocomplete(index, products, onUpdate) {
  const handleProductNameChange = useCallback(
    (e) => {
      const value = e.target.value;
      const updates = { productName: value };

      // Auto-fill price and cost from matched product
      const match = products.find(
        (p) => p.name.toLowerCase() === value.toLowerCase()
      );
      if (match) {
        updates.unitPrice = String(match.price);
        updates.productId = match.id;
        updates.costPrice = match.costPrice || 0;
      }

      onUpdate(index, updates);
    },
    [index, products, onUpdate]
  );

  const handleFieldChange = useCallback(
    (field, value) => {
      onUpdate(index, { [field]: value });
    },
    [index, onUpdate]
  );

  return {
    handleProductNameChange,
    handleFieldChange,
  };
}

/**
 * Hook for managing form state
 */
export function useSaleForm() {
  const [form, setForm] = useState({
    amountPaid: "",
    notes: "",
    items: [emptyItem()],
  });

  const updateItem = useCallback((index, updates) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], ...updates };

      // Recalculate total
      const total = items.reduce((sum, it) => {
        return (
          sum +
          (parseInt(it.quantity, 10) || 0) * (parseFloat(it.unitPrice) || 0)
        );
      }, 0);

      return {
        ...prev,
        items,
        amountPaid: total > 0 ? String(total) : prev.amountPaid,
      };
    });
  }, []);

  const addItem = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, emptyItem()],
    }));
  }, []);

  const removeItem = useCallback((index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  const updateField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setForm({
      amountPaid: "",
      notes: "",
      items: [emptyItem()],
    });
  }, []);

  return {
    form,
    updateItem,
    addItem,
    removeItem,
    updateField,
    resetForm,
  };
}
