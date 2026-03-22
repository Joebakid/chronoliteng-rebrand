"use client";

import { useState, useEffect } from "react";
import { createProduct, updateProduct } from "@/lib/api";
import ConfirmModal from "@/components/ConfirmModal";

const CATEGORIES = ["Watches", "Footwear"];
const MOVEMENTS = ["Quartz", "Mechanical", "Automatic"];
const POWER_SOURCES = ["Battery", "Solar", "Kinetic", "Manual Wind"];
const DEFAULT_CASE_SIZE = "40mm";

const inputCls = "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] w-full appearance-none shadow-sm";
const labelCls = "text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] ml-1";

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

  const isEditing = Boolean(editingProduct);
  const isWatchCategory = form.category === "Watches";

  // Populate form when editingProduct changes
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

  // Cleanup blob URLs
  useEffect(() => {
    return () => imagePreviews.forEach(url => URL.revokeObjectURL(url));
  }, [imagePreviews]);

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const setToggle = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.checked }));

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setForm(p => ({ ...p, images: files }));
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    setImagePreviews(files.map(f => URL.createObjectURL(f)));
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
      }

      onStatusChange({ type: "success", message: isEditing ? "Updated successfully." : "Product created." });
      onSuccess();
    } catch (err) {
      onStatusChange({ type: "error", message: "Action failed." });
    } finally {
      setLoading(false);
    }
  };

  // Live P&L preview
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
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 p-6 backdrop-blur-md"
          onClick={() => setSelectedImageView(null)}
        >
          <button className="absolute top-10 right-10 text-white/50 hover:text-white text-3xl transition">&times;</button>
          <img src={selectedImageView} className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl" alt="Preview" />
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Click anywhere to close</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
            {isEditing ? "Modify Product" : "New Entry"}
          </h2>
          {isEditing && (
            <button type="button" onClick={onCancel} className="text-[10px] font-bold uppercase text-[var(--accent)] underline">
              Discard
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5">

          {/* ── Basic Details ── */}
          <div className="space-y-4 rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)]/30 p-5 shadow-sm">
            <div className="space-y-1.5">
              <label className={labelCls}>Product name</label>
              <input value={form.name} onChange={setField("name")} placeholder="Chronolite Elite" required className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Selling Price (NGN)</label>
                <input type="number" value={form.price} onChange={setField("price")} required className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Cost Price (NGN)</label>
                <input type="number" value={form.costPrice} onChange={setField("costPrice")} placeholder="What you paid" className={inputCls} />
              </div>
            </div>

            {profitPreview && (
              <div className={`flex items-center justify-between rounded-xl px-4 py-2.5 border ${profitPreview.isProfit ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                <span className={`text-[10px] font-black uppercase tracking-widest ${profitPreview.isProfit ? "text-emerald-600" : "text-red-500"}`}>
                  {profitPreview.isProfit ? "▲ Profit" : "▼ Loss"}
                </span>
                <span className={`text-sm font-black ${profitPreview.isProfit ? "text-emerald-600" : "text-red-500"}`}>
                  {profitPreview.isProfit ? "+" : ""}{fmt(profitPreview.profit)} ({profitPreview.isProfit ? "+" : ""}{profitPreview.margin}%)
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Category</label>
                <select value={form.category} onChange={setField("category")} className={inputCls}>
                  {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Collection / Brand</label>
                <input value={form.collection} onChange={setField("collection")} placeholder="e.g. CASIO, TOMI" className={inputCls} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Description</label>
              <textarea value={form.description} onChange={setField("description")} rows={3} placeholder="Tell customers about this item..." className={`${inputCls} rounded-2xl resize-none`} />
            </div>
          </div>

          {/* ── Availability / Transit ── */}
          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)]/30 p-5 shadow-sm space-y-4">
            <p className="text-[9px] font-black uppercase text-[var(--accent)] tracking-widest px-1">Availability Status</p>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className="relative">
                <input type="checkbox" checked={form.inTransit} onChange={setToggle("inTransit")} className="sr-only" />
                <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${form.inTransit ? "bg-sky-500" : "bg-[var(--border)]"}`} />
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${form.inTransit ? "translate-x-5" : "translate-x-0"}`} />
              </div>
              <div>
                <p className="text-sm font-bold">Mark as In Transit</p>
                <p className="text-[10px] text-[var(--muted)]">Product ordered but hasn't arrived yet</p>
              </div>
            </label>

            {form.inTransit && (
              <div className="space-y-1.5">
                <label className={labelCls}>Transit Note (optional)</label>
                <input value={form.transitNote} onChange={setField("transitNote")} placeholder="e.g. Shipped via DHL, ETA 5 days" className={inputCls} />
              </div>
            )}
          </div>

          {/* ── Specs (Watches only) ── */}
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

              <div className="space-y-1.5">
                <label className={labelCls}>Available Variants (Colors)</label>
                <input value={form.colors} onChange={setField("colors")} placeholder="Gold, Silver, Black (comma separated)" className={inputCls} />
              </div>
            </div>
          )}

          {/* ── Media Gallery ── */}
          <div className="space-y-4 px-1">
            <label className={labelCls}>Product Gallery</label>
            <div className="relative group">
              <input type="file" multiple accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
              <div className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center group-hover:border-[var(--accent)] transition-colors">
                <p className="text-xs font-semibold text-[var(--muted)]">
                  {form.images.length > 0 || existingImages.length > 0 ? "Manage or Add Images" : "Click to select images"}
                </p>
              </div>
            </div>

            {(imagePreviews.length > 0 || existingImages.length > 0) && (
              <div className="grid grid-cols-4 gap-3 pt-2">
                {existingImages.map((url, i) => (
                  <div key={`exist-${i}`} onClick={() => setSelectedImageView(url)} className="relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-[var(--border)] bg-white transition hover:scale-[1.05] hover:ring-2 hover:ring-[var(--accent)]">
                    <img src={url} className="h-full w-full object-cover" alt="Existing" />
                  </div>
                ))}
                {imagePreviews.map((url, i) => (
                  <div key={`new-${i}`} onClick={() => setSelectedImageView(url)} className="relative aspect-square cursor-pointer overflow-hidden rounded-xl border-2 border-[var(--accent)] bg-white transition hover:scale-[1.05]">
                    <img src={url} className="h-full w-full object-cover" alt="New" />
                    <div className="absolute top-1 right-1 bg-[var(--accent)] rounded-full px-1.5 py-0.5">
                      <span className="text-[6px] text-white font-bold uppercase">New</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button disabled={loading} className="w-full rounded-full bg-[var(--foreground)] py-4 text-sm font-bold uppercase tracking-widest text-[var(--surface-strong)] shadow-2xl transition active:scale-95 disabled:opacity-50">
            {loading ? "Processing..." : isEditing ? "Save Changes" : "Create Product"}
          </button>
        </form>
      </div>
    </>
  );
}