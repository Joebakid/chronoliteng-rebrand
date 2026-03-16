"use client";

import { useState, useEffect } from "react";
import { createProduct, updateProduct, deleteProduct, toggleProductStock } from "@/lib/api";
import ConfirmModal from "@/components/ConfirmModal";
import PageLoader from "@/components/PageLoader";

const CATEGORIES = ["Watches", "Footwear"];
const MOVEMENTS = ["Quartz", "Mechanical", "Automatic"];
const DEFAULT_CASE_SIZE = "40mm";

const inputCls = "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base sm:text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] w-full appearance-none shadow-sm";
const labelCls = "text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] ml-1";
const fmt = (n) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

export default function ProductsTab({ products, fetching, onRefresh, onStatusChange }) {
  const [form, setForm] = useState({
    name: "", price: "", description: "", category: "Watches",
    collection: "", caseSize: DEFAULT_CASE_SIZE, movement: "",
    powerSource: "", strap: "", colors: "", strapColor: "", dialColor: "", images: [],
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [togglingId, setTogglingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [confirmModal, setConfirmModal] = useState({ open: false, productId: null, productName: "", productRevenue: 0 });

  const isEditing = Boolean(editingId);
  const isWatchCategory = !form.category || form.category === "Watches";

  useEffect(() => { return () => imagePreviews.forEach(URL.revokeObjectURL); }, [imagePreviews]);

  const resetForm = () => {
    setForm({ name: "", price: "", description: "", category: "Watches", collection: "", caseSize: DEFAULT_CASE_SIZE, movement: "", powerSource: "", strap: "", colors: "", strapColor: "", dialColor: "", images: [] });
    setImagePreviews([]); setExistingImages([]); setEditingId("");
  };

  const uploadToCloudinary = async (file) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", uploadPreset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: data });
    const result = await res.json();
    return result.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrls = [];
      if (form.images.length > 0) imageUrls = await Promise.all(form.images.map((file) => uploadToCloudinary(file)));
      const payload = {
        ...form,
        price: Number(form.price),
        colors: form.colors ? form.colors.split(",").map((c) => c.trim()) : [],
        images: isEditing ? [...existingImages, ...imageUrls] : imageUrls,
      };
      if (isEditing) { await updateProduct(editingId, payload); } 
      else { await createProduct(payload); }
      resetForm();
      onStatusChange({ type: "success", message: isEditing ? "Product updated." : "Product uploaded." });
      onRefresh();
    } catch (err) {
      onStatusChange({ type: "error", message: "Operation failed." });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setExistingImages(product.images || []);
    setForm({
      name: product.name || "", price: String(product.price || ""),
      description: product.description || "", category: product.category || "Watches",
      collection: product.collection || "", caseSize: product.caseSize || DEFAULT_CASE_SIZE,
      movement: product.movement || "", strap: product.strap || "",
      colors: Array.isArray(product.colors) ? product.colors.join(", ") : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_450px] lg:items-start">
      <ConfirmModal
        open={confirmModal.open}
        title="Delete product?"
        message={`"${confirmModal.productName}" will be permanently removed.`}
        confirmLabel="Delete" danger onConfirm={() => {
          deleteProduct(confirmModal.productId).then(() => { onRefresh(); setConfirmModal({open: false}); });
        }}
        onCancel={() => setConfirmModal({ open: false })}
      />

      {/* Upload Form */}
      <div className="order-1 lg:sticky lg:top-24 space-y-6">
        <div className="flex items-center justify-between">
           <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--muted)]">{isEditing ? "Edit product" : "New upload"}</h2>
           {isEditing && <button onClick={resetForm} className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] underline">Discard</button>}
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="space-y-1.5">
            <label className={labelCls}>Product name</label>
            <input value={form.name} onChange={setField("name")} placeholder="e.g. Chronolite Executive" required className={inputCls} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Price (NGN)</label>
              <input type="number" value={form.price} onChange={setField("price")} required className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Category</label>
              <select value={form.category} onChange={setField("category")} className={inputCls}>
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          {isWatchCategory && (
            <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelCls}>Movement</label>
                  <select value={form.movement} onChange={setField("movement")} className={inputCls}>
                    <option value="">Select...</option>
                    {MOVEMENTS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Case size</label>
                  <input value={form.caseSize} onChange={setField("caseSize")} className={inputCls} />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className={labelCls}>Images</label>
            <div className="relative group">
               <input type="file" multiple accept="image/*" onChange={(e) => {
                 const files = Array.from(e.target.files || []);
                 setForm(p => ({...p, images: files}));
                 setImagePreviews(files.map(f => URL.createObjectURL(f)));
               }} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
               <div className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center group-hover:border-[var(--accent)] transition-colors">
                  <p className="text-sm font-semibold text-[var(--muted)]">Tap to upload photos</p>
               </div>
            </div>
          </div>

          <button disabled={loading} className="w-full rounded-full bg-[var(--foreground)] py-4 text-base font-bold text-[var(--surface-strong)] shadow-xl transition active:scale-95">
            {loading ? "Processing..." : isEditing ? "Update Product" : "Upload Product"}
          </button>
        </form>
      </div>

      {/* Inventory List */}
      <div className="order-2 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--muted)] flex justify-between px-2">
          <span>Inventory</span>
          <span>{products.length} Items</span>
        </h2>
        {products.map((p) => (
          <div key={p.id} className="group rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <img src={p.images?.[0]} className="w-16 h-16 rounded-2xl object-cover bg-white" alt="" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{p.name}</p>
                <p className="text-sm text-[var(--muted)]">{fmt(p.price)}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => toggleProductStock(p.id, !p.inStock).then(onRefresh)} className="rounded-xl bg-[var(--surface)] border border-[var(--border)] py-2.5 text-[10px] font-bold uppercase">{p.inStock ? "Hide" : "Show"}</button>
              <button onClick={() => handleEdit(p)} className="rounded-xl bg-[var(--surface)] border border-[var(--border)] py-2.5 text-[10px] font-bold uppercase">Edit</button>
              <button onClick={() => setConfirmModal({open: true, productId: p.id, productName: p.name})} className="rounded-xl bg-red-50 border border-red-100 py-2.5 text-[10px] font-bold uppercase text-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}