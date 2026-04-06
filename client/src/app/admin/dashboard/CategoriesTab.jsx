"use client";

import { useState, useEffect } from "react";
import { getCategories, createCategory, deleteCategory } from "@/lib/api";
import ConfirmModal from "@/components/ConfirmModal";

// Main admin email - sees everything
const MAIN_ADMIN_EMAIL = "josephbawo@gmail.com";

export default function CategoriesTab({ user }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null, name: "" });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories(user?.id, user?.email);
      setCategories(data);
    } catch (err) {
      console.error("[CategoriesTab] fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, [user?.id, user?.email]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    // Check for duplicate
    const exists = categories.some(
      (c) => c.name.toLowerCase() === newName.trim().toLowerCase()
    );
    if (exists) {
      setError(`"${newName.trim()}" already exists`);
      return;
    }

    setAdding(true);
    setError("");
    try {
      await createCategory(newName.trim(), user?.id);
      setNewName("");
      await fetchCategories();
    } catch (err) {
      setError(err.message || "Failed to add category");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCategory(confirmModal.id);
      setConfirmModal({ open: false, id: null, name: "" });
      await fetchCategories();
    } catch (err) {
      console.error("[CategoriesTab] delete error:", err);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <ConfirmModal
        open={confirmModal.open}
        title="Delete category?"
        message={`"${confirmModal.name}" will be removed. Products in this category won't be deleted but will lose their category label.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmModal({ open: false, id: null, name: "" })}
      />

      <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
          Product Categories
        </h2>
        <p className="text-xs text-[var(--muted)] mt-1 opacity-70">
          Categories appear in the product form and on the storefront filter.
        </p>
      </div>

      {/* Add new category */}
      <form onSubmit={handleAdd} className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)]/30 p-5 shadow-sm space-y-3">
        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)]">
          Add New Category
        </p>
        <div className="flex gap-3">
          <input
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setError(""); }}
            placeholder="e.g. Accessories, Bags, Clothing..."
            className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition"
          />
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="rounded-full bg-[var(--foreground)] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[var(--surface-strong)] transition active:scale-95 disabled:opacity-50 whitespace-nowrap"
          >
            {adding ? "Adding..." : "+ Add"}
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-500 font-medium">{error}</p>
        )}
      </form>

      {/* Categories list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--muted)]">
            All Categories
          </p>
          <span className="text-[10px] font-bold text-[var(--accent)]">
            {categories.length} total
          </span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-14 rounded-2xl bg-[var(--border)] animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[var(--border)] py-12 text-center">
            <p className="text-sm text-[var(--muted)]">No categories yet.</p>
            <p className="text-[11px] text-[var(--muted)] opacity-60 mt-1">
              Add your first category above.
            </p>
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                <p className="text-sm font-bold">{cat.name}</p>
              </div>
              <button
                onClick={() => setConfirmModal({ open: true, id: cat.id, name: cat.name })}
                className="text-[10px] font-bold uppercase text-red-400 hover:text-red-600 transition px-2 py-1 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
