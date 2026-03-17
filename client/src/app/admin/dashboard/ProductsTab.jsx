"use client";

import { useState, useEffect } from "react";
import { createProduct, updateProduct, deleteProduct, toggleProductStock } from "@/lib/api";
import ConfirmModal from "@/components/ConfirmModal";

const CATEGORIES = ["Watches", "Footwear"];
const MOVEMENTS = ["Quartz", "Mechanical", "Automatic"];
const POWER_SOURCES = ["Battery", "Solar", "Kinetic", "Manual Wind"];
const DEFAULT_CASE_SIZE = "40mm";

const inputCls = "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] w-full appearance-none shadow-sm";
const labelCls = "text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] ml-1";
const fmt = (n) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

export default function ProductsTab({ products, fetching, onRefresh, onStatusChange }) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    category: "Watches",
    collection: "",
    caseSize: DEFAULT_CASE_SIZE,
    movement: "",
    powerSource: "",
    strap: "",
    strapColor: "",
    dialColor: "",
    colors: "", // ADDED BACK: Available colors comma string
    images: [],
  });

  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [confirmModal, setConfirmModal] = useState({ open: false, productId: null, productName: "" });

  const isEditing = Boolean(editingId);
  const isWatchCategory = form.category === "Watches";

  const resetForm = () => {
    setForm({
      name: "", price: "", description: "", category: "Watches",
      collection: "", caseSize: DEFAULT_CASE_SIZE, movement: "",
      powerSource: "", strap: "", strapColor: "", dialColor: "",
      colors: "", images: []
    });
    setImagePreviews([]);
    setExistingImages([]);
    setEditingId("");
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
      onStatusChange({ type: "success", message: isEditing ? "Updated successfully." : "Uploaded successfully." });
      onRefresh();
    } catch (err) {
      onStatusChange({ type: "error", message: "Action failed." });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setExistingImages(product.images || []);
    setForm({
      ...product,
      price: String(product.price || ""),
      colors: Array.isArray(product.colors) ? product.colors.join(", ") : "",
      images: []
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_450px] lg:items-start">
      <ConfirmModal
        open={confirmModal.open}
        title="Delete product?"
        message={`"${confirmModal.productName}" will be deleted.`}
        confirmLabel="Delete" danger onConfirm={() => {
          deleteProduct(confirmModal.productId).then(() => { onRefresh(); setConfirmModal({open: false}); });
        }}
        onCancel={() => setConfirmModal({ open: false })}
      />

      <div className="order-1 lg:sticky lg:top-24 space-y-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--muted)]">{isEditing ? "Modify Product" : "New Entry"}</h2>
          {isEditing && <button type="button" onClick={resetForm} className="text-[10px] font-bold uppercase text-[var(--accent)] underline">Discard</button>}
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5">
          {/* Section 1: Basic Details */}
          <div className="space-y-4 rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)]/30 p-5 shadow-sm">
            <div className="space-y-1.5">
              <label className={labelCls}>Product name</label>
              <input value={form.name} onChange={setField("name")} placeholder="Chronolite Elite" required className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-1.5">
              <label className={labelCls}>Description</label>
              <textarea value={form.description} onChange={setField("description")} rows={3} placeholder="Tell customers about this item..." className={`${inputCls} rounded-2xl resize-none`} />
            </div>
          </div>

          {/* Section 2: Technical Specifications */}
          {isWatchCategory && (
            <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-5 space-y-5 shadow-sm">
               <p className="text-[9px] font-black uppercase text-[var(--accent)] tracking-widest px-1">Detailed Specifications</p>
               
               <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelCls}>Movement</label>
                  <select value={form.movement} onChange={setField("movement")} className={inputCls}>
                    <option value="">Select...</option>
                    {MOVEMENTS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Powered By</label>
                  <select value={form.powerSource} onChange={setField("powerSource")} className={inputCls}>
                    <option value="">Select...</option>
                    {POWER_SOURCES.map((ps) => <option key={ps} value={ps}>{ps}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelCls}>Dial Color</label>
                  <input value={form.dialColor} onChange={setField("dialColor")} placeholder="e.g. Navy Blue" className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Case Size</label>
                  <input value={form.caseSize} onChange={setField("caseSize")} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelCls}>Strap Material</label>
                  <input value={form.strap} onChange={setField("strap")} placeholder="e.g. Silicone" className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Strap Color</label>
                  <input value={form.strapColor} onChange={setField("strapColor")} placeholder="e.g. Matte Black" className={inputCls} />
                </div>
              </div>

              {/* AVAILABLE COLORS FIELD (RESTORED) */}
              <div className="space-y-1.5">
                <label className={labelCls}>Available Variants (Colors)</label>
                <input value={form.colors} onChange={setField("colors")} placeholder="Gold, Silver, Black (comma separated)" className={inputCls} />
              </div>
            </div>
          )}

          {/* Section 3: Media */}
          <div className="space-y-1.5 px-1">
            <label className={labelCls}>Product Gallery</label>
            <div className="relative group">
               <input type="file" multiple accept="image/*" onChange={(e) => {
                 const files = Array.from(e.target.files || []);
                 setForm(p => ({...p, images: files}));
                 setImagePreviews(files.map(f => URL.createObjectURL(f)));
               }} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
               <div className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center group-hover:border-[var(--accent)] transition-colors">
                  <p className="text-xs font-semibold text-[var(--muted)]">
                    {form.images.length > 0 ? `${form.images.length} files ready` : "Click to select images"}
                  </p>
               </div>
            </div>
          </div>

          <button disabled={loading} className="w-full rounded-full bg-[var(--foreground)] py-4 text-sm font-bold uppercase tracking-widest text-[var(--surface-strong)] shadow-2xl transition active:scale-95 disabled:opacity-50">
            {loading ? "Processing..." : isEditing ? "Save Changes" : "Create Product"}
          </button>
        </form>
      </div>

      {/* Inventory Display */}
      <div className="order-2 space-y-4">
        <div className="flex items-center justify-between px-2 mb-2">
           <h2 className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-[var(--muted)]">Inventory</h2>
           <span className="text-[10px] font-bold text-[var(--accent)]">{products.length} Styles</span>
        </div>
        {products.map((p) => (
          <div key={p.id} className="group rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <img src={p.images?.[0]} className="w-16 h-16 rounded-2xl object-cover bg-white border border-[var(--border)]" alt={p.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{p.name}</p>
                <p className="text-sm font-medium text-[var(--accent)]">{fmt(p.price)}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => toggleProductStock(p.id, !p.inStock).then(onRefresh)} className="rounded-xl bg-[var(--surface)] border border-[var(--border)] py-2 text-[10px] font-bold uppercase">{p.inStock ? "Hide" : "Show"}</button>
              <button onClick={() => handleEdit(p)} className="rounded-xl bg-[var(--surface)] border border-[var(--border)] py-2 text-[10px] font-bold uppercase">Edit</button>
              <button onClick={() => setConfirmModal({open: true, productId: p.id, productName: p.name})} className="rounded-xl bg-red-50 border border-red-100 py-2 text-[10px] font-bold uppercase text-red-600">Del</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}