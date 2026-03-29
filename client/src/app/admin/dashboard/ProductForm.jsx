"use client";

import { useState, useEffect } from "react";
import { createProduct, updateProduct, getCategories } from "@/lib/api";
import CoreDetailsSection from "./CoreDetailsSection";
import WatchSpecsSection from "./WatchSpecsSection";
import PerfumeSpecsSection from "./PerfumeSpecsSection";
import CustomFieldsSection from "./CustomFieldsSection";
import InTransitSection from "./InTransitSection";
import ImageUploader from "./ImageUploader";

const emptyForm = {
  name: "", price: "", costPrice: "", description: "", category: "Watches",
  collection: "", images: [], inTransit: false, transitNote: "",
  caseSize: "40mm", movement: "Quartz", powerSource: "Battery",
  material: "Silicone", dialColor: "", strapColor: "All", perfumeSize: "",
};

export default function ProductForm({ editingProduct, onSuccess, onCancel, onStatusChange }) {
  const [form, setForm] = useState(emptyForm);
  const [customFields, setCustomFields] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState(["Watches", "Perfumes"]);

  const isEditing = Boolean(editingProduct);
  const isWatchCategory = form.category?.toLowerCase() === "watches";
  const isPerfumeCategory = form.category?.toLowerCase() === "perfumes" || form.category?.toLowerCase() === "perfume";

  useEffect(() => {
    getCategories()
      .then((data) => { if (data.length > 0) setCategories(data.map((c) => c.name)); })
      .catch(() => setCategories(["Watches", "Perfumes"]));
  }, []);

  useEffect(() => {
    if (editingProduct) {
      setForm({ ...emptyForm, ...editingProduct, price: String(editingProduct.price || ""), costPrice: String(editingProduct.costPrice || ""), images: [] });
      setExistingImages(editingProduct.images || []);
      const standardKeys = Object.keys(emptyForm).concat(["id", "createdAt", "updatedAt", "_id", "__v", "slug", "inStock"]);
      const extraFields = Object.keys(editingProduct).filter((key) => !standardKeys.includes(key)).map((key) => ({ label: key, value: String(editingProduct[key]) }));
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
    return () => imagePreviews.forEach((url) => URL.revokeObjectURL(url));
  }, [imagePreviews]);

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
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setForm((p) => ({ ...p, images: [...p.images, ...files] }));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removeNewImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setForm((p) => ({ ...p, images: p.images.filter((_, i) => i !== index) }));
  };

  const removeExistingImage = (index) => setExistingImages((prev) => prev.filter((_, i) => i !== index));

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
      const extras = customFields.reduce((acc, field) => { if (field.label) acc[field.label] = field.value; return acc; }, {});
      const payload = { ...form, ...extras, price: Number(form.price), costPrice: form.costPrice ? Number(form.costPrice) : null, images: isEditing ? [...existingImages, ...imageUrls] : imageUrls };
      if (isEditing) { await updateProduct(editingProduct.id, payload); } else { await createProduct(payload); }
      setForm(emptyForm);
      setCustomFields([]);
      setImagePreviews([]);
      setExistingImages([]);
      onStatusChange({ type: "success", message: "Saved successfully." });
      onSuccess();
    } catch (err) {
      onStatusChange({ type: "error", message: "Action failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">{isEditing ? "Edit Product" : "New Product"}</h2>
        {isEditing && <button type="button" onClick={onCancel} className="text-[10px] font-bold text-[var(--accent)] underline">Discard</button>}
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
        {isWatchCategory && <WatchSpecsSection form={form} setField={setField} />}
        {isPerfumeCategory && <PerfumeSpecsSection form={form} setField={setField} />}
        <CustomFieldsSection customFields={customFields} onAdd={addCustomField} onRemove={removeCustomField} onUpdate={updateCustomField} />
        <InTransitSection form={form} setField={setField} setToggle={setToggle} />
        <button disabled={loading} className="w-full rounded-full bg-[var(--foreground)] py-4 text-sm font-bold uppercase tracking-widest text-[var(--surface-strong)] shadow-xl disabled:opacity-50">
          {loading ? "Saving..." : isEditing ? "Update Product" : "Save Product"}
        </button>
      </form>
    </div>
  );
}
