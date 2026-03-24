"use client";

import { useState, useEffect } from "react";
import { createProduct, updateProduct, getCategories } from "@/lib/api";

const MOVEMENTS = ["Quartz", "Mechanical", "Automatic"];
const POWER_SOURCES = ["Battery", "Solar", "Kinetic", "Manual Wind"];
const DEFAULT_CASE_SIZE = "40mm";

const inputCls = "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] w-full appearance-none";
const labelCls = "text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--muted)] ml-0.5";

const fmt = (n) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

const emptyForm = {
  name: "", price: "", costPrice: "", description: "", category: "Watches",
  collection: "", caseSize: DEFAULT_CASE_SIZE, movement: "", powerSource: "",
  strap: "", strapColor: "", dialColor: "", colors: "", images: [],
  inTransit: false, transitNote: "",
};

export default function ProductForm({ editingProduct, onSuccess, onCancel, onStatusChange }) {
  const [form, setForm] = useState(emptyForm);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImageView, setSelectedImageView] = useState(null);
  const [categories, setCategories] = useState(["Watches"]);

  useEffect(() => {
    getCategories()
      .then((data) => { if (data.length > 0) setCategories(data.map((c) => c.name)); })
      .catch(() => setCategories(["Watches"]));
  }, []);

  const isEditing = Boolean(editingProduct);
  const isWatchCategory = form.category?.toLowerCase() === "watches";

  useEffect(() => {
    if (editingProduct) {
      setForm({
        ...editingProduct,
        price: String(editingProduct.price || ""),
        costPrice: String(editingProduct.costPrice || ""),
        collection: editingProduct.collection || "",
        colors: Array.isArray(editingProduct.colors) ? editingProduct.colors.join(", ") : "",
        images: [],
        inTransit: editingProduct.inTransit || false,
        transitNote: editingProduct.transitNote || "",
      });
      setExistingImages(editingProduct.images || []);
      setImagePreviews([]);
    } else {
      setForm(emptyForm);
      setExistingImages([]);
      setImagePreviews([]);
    }
  }, [editingProduct]);

  useEffect(() => {
    return () => imagePreviews.forEach(url => URL.revokeObjectURL(url));
  }, []);

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const setToggle = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.checked }));

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setForm(p => ({ ...p, images: [...p.images, ...files] }));
    setImagePreviews(prev => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removeNewImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setForm(p => ({ ...p, images: p.images.filter((_, i) => i !== index) }));
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
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
      if (form.images.length > 0) {
        imageUrls = await Promise.all(form.images.map(uploadToCloudinary));
      }
      const payload = {
        ...form,
        price: Number(form.price),
        costPrice: form.costPrice ? Number(form.costPrice) : null,
        colors: form.colors ? form.colors.split(",").map((c) => c.trim()) : [],
        images: isEditing ? [...existingImages, ...imageUrls] : imageUrls,
      };
    if (isEditing) {
  await updateProduct(editingProduct.id, payload);
} else {
  await createProduct(payload);

  // reset form after creating product
  setForm(emptyForm);
  setImagePreviews([]);
  setExistingImages([]);
}
      onStatusChange({ type: "success", message: isEditing ? "Updated." : "Created." });
      onSuccess();
    } catch (err) {
      onStatusChange({ type: "error", message: "Action failed." });
    } finally {
      setLoading(false);
    }
  };

  const profitPreview = (() => {
    if (!form.price || !form.costPrice) return null;
    const profit = Number(form.price) - Number(form.costPrice);
    const margin = ((profit / Number(form.costPrice)) * 100).toFixed(1);
    return { profit, margin, isProfit: profit >= 0 };
  })();

  return (
    <>
      {/* Lightbox */}
      {selectedImageView && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 p-4 backdrop-blur-md"
          onClick={() => setSelectedImageView(null)}
        >
          <button className="absolute top-6 right-6 text-white/50 hover:text-white text-3xl transition">&times;</button>
          <img src={selectedImageView} className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl" alt="Preview" />
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Tap to close</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
            {isEditing ? "Edit Product" : "New Product"}
          </h2>
          {isEditing && (
            <button type="button" onClick={onCancel} className="text-[10px] font-bold uppercase text-[var(--accent)] underline">
              Discard
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Basic Details ── */}
          <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]/30 p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)]">Basic Info</p>

            <div className="space-y-1">
              <label className={labelCls}>Name</label>
              <input
                value={form.name}
                onChange={setField("name")}
                placeholder="Product name"
                required
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className={labelCls}>Price (₦)</label>
                <input type="number" value={form.price} onChange={setField("price")} required placeholder="0" className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Cost (₦)</label>
                <input type="number" value={form.costPrice} onChange={setField("costPrice")} placeholder="0" className={inputCls} />
              </div>
            </div>

            {profitPreview && (
              <div className={`flex items-center justify-between rounded-xl px-3 py-2 border text-xs ${profitPreview.isProfit ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600" : "bg-red-500/5 border-red-500/20 text-red-500"}`}>
                <span className="font-black uppercase text-[10px]">{profitPreview.isProfit ? "▲ Profit" : "▼ Loss"}</span>
                <span className="font-black">{profitPreview.isProfit ? "+" : ""}{fmt(profitPreview.profit)} ({profitPreview.isProfit ? "+" : ""}{profitPreview.margin}%)</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className={labelCls}>Category</label>
                <select value={form.category} onChange={setField("category")} className={inputCls}>
                  {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Brand</label>
                <input value={form.collection} onChange={setField("collection")} placeholder="CASIO, TOMI..." className={inputCls} />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelCls}>Description</label>
              <textarea
                value={form.description}
                onChange={setField("description")}
                rows={3}
                placeholder="Tell customers about this item..."
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>

          {/* ── Transit ── */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]/30 p-4 space-y-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)]">Availability</p>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className="relative flex-shrink-0">
                <input type="checkbox" checked={form.inTransit} onChange={setToggle("inTransit")} className="sr-only" />
                <div className={`w-10 h-5 rounded-full transition-colors ${form.inTransit ? "bg-sky-500" : "bg-[var(--border)]"}`} />
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.inTransit ? "translate-x-5" : "translate-x-0"}`} />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">In Transit</p>
                <p className="text-[10px] text-[var(--muted)]">Ordered, not arrived yet</p>
              </div>
            </label>

            {form.inTransit && (
              <div className="space-y-1">
                <label className={labelCls}>Transit Note</label>
                <input value={form.transitNote} onChange={setField("transitNote")} placeholder="e.g. Via DHL, ETA 5 days" className={inputCls} />
              </div>
            )}
          </div>

          {/* ── Watch Specs ── */}
          {isWatchCategory && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 space-y-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)]">Watch Specs</p>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className={labelCls}>Movement</label>
                  <select value={form.movement} onChange={setField("movement")} className={inputCls}>
                    <option value="">Select</option>
                    {MOVEMENTS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Power</label>
                  <select value={form.powerSource} onChange={setField("powerSource")} className={inputCls}>
                    <option value="">Select</option>
                    {POWER_SOURCES.map((ps) => <option key={ps} value={ps}>{ps}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className={labelCls}>Dial Color</label>
                  <input value={form.dialColor} onChange={setField("dialColor")} placeholder="Navy Blue" className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Case Size</label>
                  <input value={form.caseSize} onChange={setField("caseSize")} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className={labelCls}>Strap Material</label>
                  <input value={form.strap} onChange={setField("strap")} placeholder="Silicone" className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Strap Color</label>
                  <input value={form.strapColor} onChange={setField("strapColor")} placeholder="Black" className={inputCls} />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Variants</label>
                <input value={form.colors} onChange={setField("colors")} placeholder="Gold, Silver, Black" className={inputCls} />
              </div>
            </div>
          )}

          {/* ── Images ── */}
          <div className="space-y-3 px-0.5">
            <label className={labelCls}>Product Images</label>
            <div className="relative group">
              <input type="file" multiple accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
              <div className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-center group-hover:border-[var(--accent)] transition-colors">
                <p className="text-xs font-semibold text-[var(--muted)]">
                  {form.images.length > 0 || existingImages.length > 0 ? "Tap to add more" : "Tap to select images"}
                </p>
              </div>
            </div>

            {(imagePreviews.length > 0 || existingImages.length > 0) && (
              <div className="grid grid-cols-4 gap-2">
                {existingImages.map((url, i) => (
                  <div key={`exist-${i}`} className="relative aspect-square overflow-hidden rounded-xl border border-[var(--border)] bg-white">
                    <img
                      src={url}
                      className="h-full w-full object-cover cursor-pointer"
                      onClick={() => setSelectedImageView(url)}
                      alt=""
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs font-bold flex items-center justify-center hover:bg-red-500 transition z-10"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {imagePreviews.map((url, i) => (
                  <div key={`new-${i}`} className="relative aspect-square overflow-hidden rounded-xl border-2 border-[var(--accent)] bg-white">
                    <img
                      src={url}
                      className="h-full w-full object-cover cursor-pointer"
                      onClick={() => setSelectedImageView(url)}
                      alt=""
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs font-bold flex items-center justify-center hover:bg-red-500 transition z-10"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-1 left-1 bg-[var(--accent)] rounded-full px-1 py-0.5">
                      <span className="text-[6px] text-white font-bold uppercase">New</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            disabled={loading}
            className="w-full rounded-full bg-[var(--foreground)] py-3.5 text-sm font-bold uppercase tracking-widest text-[var(--surface-strong)] shadow-xl transition active:scale-95 disabled:opacity-50"
          >
            {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Product"}
          </button>
        </form>
      </div>
    </>
  );
}