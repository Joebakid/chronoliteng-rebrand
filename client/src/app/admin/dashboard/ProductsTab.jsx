"use client";

import { useState, useEffect } from "react";
import { createProduct, updateProduct, deleteProduct, toggleProductStock } from "@/lib/api";
import ConfirmModal from "@/components/ConfirmModal";
import PageLoader from "@/components/PageLoader";

const CATEGORIES = ["Watches", "Footwear"];
const MOVEMENTS = ["Quartz", "Mechanical", "Automatic"];
const POWER_SOURCES = ["Battery", "Self-winding (Automatic)", "Manual-winding"];
const DEFAULT_CASE_SIZE = "40mm";

/** * CRITICAL FOR MOBILE: 
 * Font size must be at least 16px (text-base) to prevent auto-zoom on iOS.
 * We use text-base for mobile and sm:text-sm for larger screens.
 */
const inputCls = "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] w-full appearance-none";
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
    setImagePreviews([]);
    setExistingImages([]);
    setEditingId("");
  };

  const uploadToCloudinary = async (file) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) throw new Error("Cloudinary settings missing.");
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", uploadPreset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: data });
    if (!res.ok) throw new Error("Cloudinary upload failed");
    const result = await res.json();
    return result.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    onStatusChange({ type: "", message: "" });
    try {
      let imageUrls = [];
      if (form.images.length > 0) imageUrls = await Promise.all(form.images.map((file) => uploadToCloudinary(file)));
      
      const payload = {
        ...form,
        price: Number(form.price),
        category: form.category || "Watches",
        colors: form.colors ? form.colors.split(",").map((c) => c.trim()) : [],
        // Combine existing and new images if editing
        images: isEditing 
          ? [...existingImages, ...imageUrls] 
          : imageUrls,
      };

      if (isEditing) { 
        await updateProduct(editingId, payload); 
      } else { 
        await createProduct(payload); 
      }
      
      resetForm();
      onStatusChange({ type: "success", message: isEditing ? "Product updated." : "Product uploaded." });
      onRefresh();
    } catch (err) {
      onStatusChange({ type: "error", message: err.message || "Operation failed." });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setExistingImages(Array.isArray(product.images) ? product.images : []);
    setForm({
      name: product.name || "", price: String(product.price || ""),
      description: product.description || "", category: product.category || "Watches",
      collection: product.collection || "", caseSize: product.caseSize || DEFAULT_CASE_SIZE,
      movement: product.movement || "", powerSource: product.powerSource || "",
      strap: product.strap || "", colors: Array.isArray(product.colors) ? product.colors.join(", ") : "",
      strapColor: product.strapColor || "", dialColor: product.dialColor || "", images: [],
    });
    setImagePreviews([]);
    onStatusChange({ type: "", message: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = (product) => {
    setConfirmModal({ open: true, productId: product.id, productName: product.name, productRevenue: Number(product.price || 0) });
  };

  const handleDeleteConfirm = async () => {
    const { productId } = confirmModal;
    setConfirmModal({ open: false, productId: null, productName: "", productRevenue: 0 });
    setDeletingId(productId);
    try {
      await deleteProduct(productId);
      onStatusChange({ type: "success", message: "Product deleted." });
      onRefresh();
    } catch (err) {
      onStatusChange({ type: "error", message: err.message || "Delete failed." });
    } finally {
      setDeletingId("");
    }
  };

  const handleStockToggle = async (product) => {
    setTogglingId(product.id);
    try {
      await toggleProductStock(product.id, !product.inStock);
      onStatusChange({ type: "success", message: `Status updated.` });
      onRefresh();
    } catch (err) {
      onStatusChange({ type: "error", message: err.message || "Stock update failed." });
    } finally {
      setTogglingId("");
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    setForm((prev) => ({ ...prev, images: files }));
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeNewPreview = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setForm((prev) => { const updated = [...prev.images]; updated.splice(index, 1); return { ...prev, images: updated }; });
    setImagePreviews((prev) => { const updated = [...prev]; updated.splice(index, 1); return updated; });
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => { const updated = [...prev]; updated.splice(index, 1); return updated; });
  };

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="flex flex-col gap-10 lg:grid lg:grid-cols-2 lg:items-start">
      <ConfirmModal
        open={confirmModal.open}
        title="Delete product?"
        message={`"${confirmModal.productName}" will be permanently removed.`}
        confirmLabel="Delete" cancelLabel="Cancel" danger withRevenueOption
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmModal({ open: false, productId: null, productName: "", productRevenue: 0 })}
      />

      {/* Form Section */}
      <div className="order-1 lg:sticky lg:top-24">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
            {isEditing ? "Edit product" : "New upload"}
          </h2>
          {isEditing && (
            <button onClick={resetForm} className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] underline">
              Create New instead
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="space-y-1.5">
            <label className={labelCls}>Product name</label>
            <input value={form.name} onChange={setField("name")} placeholder="e.g. Chronolite Executive" required className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Price (NGN)</label>
              <input type="number" inputMode="numeric" value={form.price} onChange={setField("price")} required className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Category</label>
              <select value={form.category} onChange={setField("category")} className={inputCls}>
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Description</label>
            <textarea required rows={3} value={form.description} onChange={setField("description")} className={`${inputCls} resize-none`} />
          </div>

          {isWatchCategory && (
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 sm:p-6 space-y-5">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)] text-center mb-2">Technical Specs</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelCls}>Movement</label>
                  <select value={form.movement} onChange={setField("movement")} className={inputCls}>
                    <option value="">Select...</option>
                    {MOVEMENTS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Collection</label>
                  <input value={form.collection} onChange={setField("collection")} placeholder="Heritage" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelCls}>Case size</label>
                  <input value={form.caseSize} onChange={setField("caseSize")} placeholder="40mm" className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Strap material</label>
                  <input value={form.strap} onChange={setField("strap")} placeholder="Leather" className={inputCls} />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className={labelCls}>Images</label>
            <div className="relative">
               <input
                type="file" multiple accept="image/*" required={!isEditing && existingImages.length === 0}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                onChange={handleImageChange}
              />
              <div className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-center">
                <p className="text-sm font-medium text-[var(--muted)]">Tap to upload photos</p>
                <p className="text-[10px] text-[var(--muted)] opacity-60 mt-1">High quality JPEGs preferred</p>
              </div>
            </div>

            {/* Preview Areas */}
            {(existingImages.length > 0 || imagePreviews.length > 0) && (
              <div className="mt-4 flex flex-wrap gap-3 p-2 bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
                {existingImages.map((url, i) => (
                  <div key={`ex-${i}`} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[var(--border)]">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeExistingImage(i)} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg shadow-lg">✕</button>
                  </div>
                ))}
                {imagePreviews.map((src, i) => (
                  <div key={`pre-${i}`} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[var(--accent)]">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeNewPreview(i)} className="absolute top-0 right-0 bg-black text-white p-1 rounded-bl-lg">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button disabled={loading} className="w-full rounded-full bg-[var(--foreground)] py-4 text-base font-bold text-[var(--surface-strong)] shadow-xl disabled:opacity-50 transition active:scale-95">
            {loading ? "Please wait..." : isEditing ? "Update Product" : "Upload Product"}
          </button>
        </form>
      </div>

      {/* Product List Section */}
      <div className="order-2">
        <h2 className="mb-6 text-sm font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
          Inventory ({products.length})
        </h2>
        <div className="grid gap-3">
          {fetching ? (
            <PageLoader text="Syncing..." />
          ) : products.length === 0 ? (
            <div className="px-4 py-20 text-center rounded-3xl border border-dashed border-[var(--border)] text-sm text-[var(--muted)]">No products found.</div>
          ) : (
            products.map((p) => (
              <div key={p.id} className="flex flex-col gap-3 rounded-3xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt="" className="w-16 h-16 rounded-2xl object-cover border border-[var(--border)] shadow-sm" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[8px] text-[var(--muted)]">No Image</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[var(--foreground)]">{p.name}</p>
                    <p className="text-sm font-medium text-[var(--muted)]">{fmt(p.price)}</p>
                    <div className="mt-1 flex gap-2">
                       <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${p.inStock ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {p.inStock ? "Live" : "Hidden"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button onClick={() => handleStockToggle(p)} disabled={togglingId === p.id} className="flex-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] py-2.5 text-[11px] font-bold uppercase tracking-wider transition active:bg-[var(--background-strong)]">
                    {p.inStock ? "Hide" : "Show"}
                  </button>
                  <button onClick={() => handleEdit(p)} className="flex-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] py-2.5 text-[11px] font-bold uppercase tracking-wider transition active:bg-[var(--background-strong)]">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteClick(p)} disabled={deletingId === p.id} className="flex-1 rounded-xl bg-red-50 border border-red-100 py-2.5 text-[11px] font-bold uppercase tracking-wider text-red-600 transition active:bg-red-100">
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}