"use client";

import { useState, useEffect, useRef } from "react";
import { createProduct, updateProduct, getCategories } from "@/lib/api";
import CoreDetailsSection from "./CoreDetailsSection";
import WatchSpecsSection from "./WatchSpecsSection";
import PerfumeSpecsSection from "./PerfumeSpecsSection";
import GoldSpecsSection from "./GoldSpecsSection";
import CustomFieldsSection from "./CustomFieldsSection";
import InTransitSection from "./InTransitSection";
import ImageUploader from "./ImageUploader";

// Added 'source' to the empty form state
const emptyForm = {
  name: "", price: "", costPrice: "", description: "", category: "",
  collection: "", images: [], inTransit: false, transitNote: "",
  caseSize: "40mm", movement: "Quartz", powerSource: "Battery",
  dialColor: "", strapColor: "All", perfumeSize: "",
  weight: "", source: "", 
};

// Main admin email - sees everything
const MAIN_ADMIN_EMAIL = "josephbawo@gmail.com";

export default function ProductForm({ editingProduct, onSuccess, onCancel, onStatusChange, user }) {
  const [form, setForm] = useState(emptyForm);
  const [customFields, setCustomFields] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState(["Watches", "Perfumes"]);

  // 1. TRACK BLOB URLS IN A REF
  const blobUrlsRef = useRef([]);

  const isEditing = Boolean(editingProduct);
  const categoryLower = (form.category || "").toLowerCase();
  const isWatchCategory = categoryLower === "watches";
  const isPerfumeCategory = categoryLower === "perfumes" || categoryLower === "perfume";
  const isGoldCategory = categoryLower === "gold" || categoryLower === "gold replica";

  useEffect(() => {
    getCategories(user?.id, user?.email)
      .then((data) => {
        if (data.length > 0) {
          const cats = data.map((c) => c.name);
          setCategories(cats);
          if (!editingProduct && !form.category) {
            setForm((prev) => ({ ...prev, category: cats[0] }));
          }
        }
      })
      .catch(() => setCategories(["Watches", "Perfumes"]));
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (editingProduct) {
      // Ensure source is captured if editing an existing product
      setForm({ 
        ...emptyForm, 
        ...editingProduct, 
        price: String(editingProduct.price || ""), 
        costPrice: String(editingProduct.costPrice || ""), 
        source: editingProduct.source || "",
        images: [] 
      });
      setExistingImages(editingProduct.images || []);
      const standardKeys = Object.keys(emptyForm).concat(["id", "createdAt", "updatedAt", "_id", "__v", "slug", "inStock", "createdBy"]);
      const extraFields = Object.keys(editingProduct).filter((key) => !standardKeys.includes(key)).map((key) => ({ label: key, value: String(editingProduct[key]) }));
      setCustomFields(extraFields);
      setImagePreviews([]);
    } else {
      setForm((prev) => ({ ...emptyForm, category: categories[0] || "" }));
      setCustomFields([]);
      setExistingImages([]);
      setImagePreviews([]);
    }
  }, [editingProduct]);

  /**
   * 2. STABLE CLEANUP LOGIC
   */
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
      blobUrlsRef.current = [];
    };
  }, []); 

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const setToggle = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.checked }));

  const addCustomField = () => setCustomFields([...customFields, { label: "", value: "" }]);
  const removeCustomField = (index) => setCustomFields(customFields.filter((_, i) => i !== index));
  const updateCustomField = (index, key, val) => {
    const updated = [...customFields];
    updated[index][key] = val;
    setCustomFields(updated);
  };

  /**
   * 3. SAFE FILE HANDLING
   */
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPreviews = files.map((f) => {
      const url = URL.createObjectURL(f);
      blobUrlsRef.current.push(url);
      return url;
    });

    setForm((prev) => ({ ...prev, images: [...prev.images, ...files] }));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removeNewImage = (index) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const removeExistingImage = (index) => setExistingImages((prev) => prev.filter((_, i) => i !== index));

  const uploadToCloudinary = async (file) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", uploadPreset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: data });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error?.message || "Upload failed");
    return result.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      let imageUrls = [];
      if (form.images.length > 0) {
        imageUrls = await Promise.all(form.images.map(uploadToCloudinary));
      }
      const extras = customFields.reduce((acc, field) => { if (field.label) acc[field.label] = field.value; return acc; }, {});
      const payload = { ...form, ...extras, price: Number(form.price), costPrice: form.costPrice ? Number(form.costPrice) : null, images: isEditing ? [...existingImages, ...imageUrls] : imageUrls };

      if (isEditing) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload, user?.id);
      }

      setForm(emptyForm);
      setCustomFields([]);
      setImagePreviews([]);
      setExistingImages([]);
      onStatusChange({ type: "success", message: "Product saved successfully!" });
      onSuccess();
    } catch (err) {
      onStatusChange({ type: "error", message: err.message || "Failed to save product." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">{isEditing ? "Edit Product" : "New Product"}</h2>
        {isEditing && <button type="button" onClick={onCancel} className="text-[10px] font-bold text-[var(--accent)] underline">Discard Changes</button>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pb-20">
        <ImageUploader
          existingImages={existingImages}
          imagePreviews={imagePreviews}
          onAddFiles={handleFileChange}
          onRemoveExisting={removeExistingImage}
          onRemoveNew={removeNewImage}
        />
        
        <CoreDetailsSection form={form} setField={setField} categories={categories} />

        {/* --- NEW SUPPLIER INFO SECTION --- */}
        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]/30 p-4 sm:p-5 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)] px-1">Supplier Info</p>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] ml-1">Distributor / Source</label>
            <input
              type="text"
              value={form.source || ""} // <--- Fixed the uncontrolled input error
              onChange={setField("source")}
              placeholder="e.g. Lagos Market, Supplier A..."
              className="w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] shadow-sm"
            />
          </div>
        </div>
        {/* --------------------------------- */}

        {isWatchCategory && <WatchSpecsSection form={form} setField={setField} />}
        {isPerfumeCategory && <PerfumeSpecsSection form={form} setField={setField} />}
        {isGoldCategory && <GoldSpecsSection form={form} setField={setField} />}
        
        <CustomFieldsSection customFields={customFields} onAdd={addCustomField} onRemove={removeCustomField} onUpdate={updateCustomField} />
        
        <InTransitSection form={form} setField={setField} setToggle={setToggle} />
        
        <button type="submit" disabled={loading} className="w-full rounded-full bg-[var(--foreground)] py-4 text-sm font-bold uppercase tracking-widest text-[var(--surface-strong)] shadow-xl disabled:opacity-50 transition-all active:scale-95">
          {loading ? "Saving to Cloud..." : isEditing ? "Update Product" : "Save Product"}
        </button>
      </form>
    </div>
  );
}