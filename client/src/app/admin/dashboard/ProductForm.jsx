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
  inTransit: false, transitNote: "", perfumeSize: "",
};

export default function ProductForm({ editingProduct, onSuccess, onCancel, onStatusChange }) {
  const [form, setForm] = useState(emptyForm);
  const [customFields, setCustomFields] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImageView, setSelectedImageView] = useState(null);
  const [categories, setCategories] = useState(["Watches", "Perfumes"]);

  // Fetch Categories
  useEffect(() => {
    getCategories()
      .then((data) => { if (data.length > 0) setCategories(data.map((c) => c.name)); })
      .catch(() => setCategories(["Watches", "Perfumes"]));
  }, []);

  const isEditing = Boolean(editingProduct);
  const isWatchCategory = form.category?.toLowerCase() === "watches";
  const isPerfumeCategory = form.category?.toLowerCase() === "perfumes" || form.category?.toLowerCase() === "perfume";

  // Sync Form when Editing
  useEffect(() => {
    if (editingProduct) {
      setForm({
        ...emptyForm,
        ...editingProduct,
        price: String(editingProduct.price || ""),
        costPrice: String(editingProduct.costPrice || ""),
        colors: Array.isArray(editingProduct.colors) ? editingProduct.colors.join(", ") : "",
        images: [], // New uploads only
      });
      setExistingImages(editingProduct.images || []);
      
      // Logic to pull out "Unknown" fields into Custom Fields for editing
      const standardKeys = Object.keys(emptyForm).concat(['id', 'createdAt', 'updatedAt', '_id', '__v']);
      const extraFields = Object.keys(editingProduct)
        .filter(key => !standardKeys.includes(key))
        .map(key => ({ label: key, value: String(editingProduct[key]) }));
      
      setCustomFields(extraFields);
      setImagePreviews([]);
    } else {
      setForm(emptyForm);
      setCustomFields([]);
      setExistingImages([]);
      setImagePreviews([]);
    }
  }, [editingProduct]);

  useEffect(() => {
    return () => imagePreviews.forEach(url => URL.revokeObjectURL(url));
  }, [imagePreviews]);

  // Handlers
  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const setToggle = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.checked }));

  const addCustomField = () => setCustomFields([...customFields, { label: "", value: "" }]);
  const removeCustomField = (index) => setCustomFields(customFields.filter((_, i) => i !== index));
  const updateCustomField = (index, key, val) => {
    const updated = [...customFields];
    updated[index][key] = val;
    setCustomFields(updated);
  };

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

  const removeExistingImage = (index) => setExistingImages(prev => prev.filter((_, i) => i !== index));

  const uploadToCloudinary = async (file) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", uploadPreset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: data });
    return (await res.json()).secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrls = [];
      if (form.images.length > 0) {
        imageUrls = await Promise.all(form.images.map(uploadToCloudinary));
      }

      // Convert custom fields array back to object properties
      const extras = customFields.reduce((acc, field) => {
        if (field.label) acc[field.label] = field.value;
        return acc;
      }, {});

      const payload = {
        ...form,
        ...extras,
        price: Number(form.price),
        costPrice: form.costPrice ? Number(form.costPrice) : null,
        colors: form.colors ? form.colors.split(",").map((c) => c.trim()) : [],
        images: isEditing ? [...existingImages, ...imageUrls] : imageUrls,
      };
      
      if (isEditing) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
        setForm(emptyForm);
      }
      onStatusChange({ type: "success", message: "Saved successfully." });
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
      {selectedImageView && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 p-4 backdrop-blur-md" onClick={() => setSelectedImageView(null)}>
          <img src={selectedImageView} className="max-h-[80vh] max-w-full rounded-2xl object-contain" alt="" />
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
            {isEditing ? "Edit Product" : "New Product"}
          </h2>
          {isEditing && (
            <button type="button" onClick={onCancel} className="text-[10px] font-bold text-[var(--accent)] underline">Discard</button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pb-20">
          {/* Basic Info */}
          <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]/30 p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)]">Core Details</p>
            <div className="space-y-1">
              <label className={labelCls}>Name</label>
              <input value={form.name} onChange={setField("name")} placeholder="Product name" required className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className={labelCls}>Category</label>
                <select value={form.category} onChange={setField("category")} className={inputCls}>
                  {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Brand</label>
                <input value={form.collection} onChange={setField("collection")} placeholder="Brand" className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className={labelCls}>Price (₦)</label>
                <input type="number" value={form.price} onChange={setField("price")} required className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Cost (₦)</label>
                <input type="number" value={form.costPrice} onChange={setField("costPrice")} className={inputCls} />
              </div>
            </div>

            {profitPreview && (
              <div className={`flex items-center justify-between rounded-xl px-3 py-2 border text-xs ${profitPreview.isProfit ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600" : "bg-red-500/5 border-red-500/20 text-red-500"}`}>
                <span className="font-black uppercase text-[10px]">{profitPreview.isProfit ? "▲ Profit" : "▼ Loss"}</span>
                <span className="font-bold">{fmt(profitPreview.profit)} ({profitPreview.margin}%)</span>
              </div>
            )}
          </div>

          {/* Perfume Specifics */}
          {isPerfumeCategory && (
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-sky-500">Perfume Specs</p>
              <div className="space-y-1">
                <label className={labelCls}>Size (mL)</label>
                <input value={form.perfumeSize} onChange={setField("perfumeSize")} placeholder="e.g. 100mL" className={inputCls} />
              </div>
            </div>
          )}

          {/* Watch Specs */}
          {isWatchCategory && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 space-y-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)]">Watch Specs</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className={labelCls}>Movement</label>
                  <select value={form.movement} onChange={setField("movement")} className={inputCls}>
                    <option value="">Select</option>
                    {MOVEMENTS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Case Size</label>
                  <input value={form.caseSize} onChange={setField("caseSize")} className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {/* Additional / Custom Fields */}
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--muted)]">Custom Fields</p>
              <button type="button" onClick={addCustomField} className="text-[10px] font-bold text-[var(--accent)]">+ Add</button>
            </div>
            {customFields.map((field, index) => (
              <div key={index} className="flex gap-2">
                <input placeholder="Label" value={field.label} onChange={(e) => updateCustomField(index, "label", e.target.value)} className={`${inputCls} text-[10px] h-9`} />
                <input placeholder="Value" value={field.value} onChange={(e) => updateCustomField(index, "value", e.target.value)} className={`${inputCls} text-[10px] h-9`} />
                <button type="button" onClick={() => removeCustomField(index)} className="px-2 text-red-500">×</button>
              </div>
            ))}
          </div>

          {/* Availability */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]/30 p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.inTransit} onChange={setToggle("inTransit")} className="sr-only" />
              <div className={`w-10 h-5 rounded-full transition-colors ${form.inTransit ? "bg-sky-500" : "bg-[var(--border)]"}`} />
              <span className="text-sm font-bold">In Transit</span>
            </label>
            {form.inTransit && <input value={form.transitNote} onChange={setField("transitNote")} placeholder="Notes..." className={`${inputCls} mt-2`} />}
          </div>

          {/* Images */}
          <div className="space-y-3">
            <label className={labelCls}>Images</label>
            <div className="relative h-20 rounded-2xl border-2 border-dashed border-[var(--border)] flex items-center justify-center">
              <input type="file" multiple accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase">Add Photos</span>
            </div>
            {(imagePreviews.length > 0 || existingImages.length > 0) && (
              <div className="grid grid-cols-4 gap-2">
                {existingImages.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-lg border overflow-hidden">
                    <img src={url} className="h-full w-full object-cover" alt="" />
                    <button type="button" onClick={() => removeExistingImage(i)} className="absolute top-0 right-0 bg-black/50 text-white p-1">×</button>
                  </div>
                ))}
                {imagePreviews.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-lg border-2 border-[var(--accent)] overflow-hidden">
                    <img src={url} className="h-full w-full object-cover" alt="" />
                    <button type="button" onClick={() => removeNewImage(i)} className="absolute top-0 right-0 bg-black/50 text-white p-1">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button disabled={loading} className="w-full rounded-full bg-[var(--foreground)] py-4 text-sm font-bold uppercase tracking-widest text-[var(--surface-strong)] shadow-xl">
            {loading ? "Saving..." : "Save Product"}
          </button>
        </form>
      </div>
    </>
  );
}