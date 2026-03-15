"use client";

import { useEffect, useState } from "react";

export default function ConfirmModal({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  withRevenueOption = false,
  onConfirm,
  onCancel,
}) {
  const [removeRevenue, setRemoveRevenue] = useState(false);

  // Reset checkbox when modal opens
  useEffect(() => {
    if (open) setRemoveRevenue(false);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[var(--shadow)]">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
          Confirm action
        </p>
        <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)]">{title}</h2>
        {message && (
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{message}</p>
        )}

        {withRevenueOption && (
          <label className="mt-4 flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={removeRevenue}
              onChange={(e) => setRemoveRevenue(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border)] accent-[var(--danger)]"
            />
            <span className="text-sm text-[var(--muted)]">
              Also remove this product's revenue from analytics
            </span>
          </label>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => onConfirm({ removeRevenue })}
            className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition ${
              danger
                ? "bg-[var(--danger)] text-white hover:opacity-90"
                : "bg-[var(--foreground)] text-[var(--surface-strong)] hover:opacity-90"
            }`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 rounded-full border border-[var(--border)] py-2.5 text-sm font-semibold transition hover:bg-[var(--surface)]"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}