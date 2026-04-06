"use client";

import { useState, useEffect, useRef } from "react";
import { createProduct, updateProduct, getCategories } from "@/lib/api";
import CoreDetailsSection from "./CoreDetailsSection";
import WatchSpecsSection from "./WatchSpecsSection";
import PerfumeSpecsSection from "./PerfumeSpecsSection";
import CustomFieldsSection from "./CustomFieldsSection";
import InTransitSection from "./InTransitSection";
import ImageUploader from "./ImageUploader";

const emptyForm = {
  name: "", price: "", costPrice: "", description: "", category: "",
  collection: "", images: [], inTransit: false, transitNote: "",
  caseSize: "40mm", movement: "Quartz", powerSource: "Battery",
  material: "Silicone", dialColor: "", strapColor: "All", perfumeSize: "",
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
  // This keeps a master list of created URLs that won't be cleared on every re-render.
  const blobUrlsRef = useRef([]);

  const isEditing = Boolean(editingProduct);
  const categoryLower = (form.category || "").toLowerCase();
  const isWatchCategory = categoryLower === "watches";
  const isPerfumeCategory = categoryLower === "perfumes" || categoryLower === "perfume";

  useEffect(() => {
    getCategories(user?.id, user?.email)
      .then((data) => {
        if (data.length > 0) {
          const cats = data.map((c) => c.name);
          setCategories(cats);
          // Set first category as default for new products
          if (!editingProduct && !form.category) {
            setForm((prev) => ({ ...prev, category: cats[0] }));
          }
        }
      })
      .catch(() => setCategories(["Watches", "Perfumes"]));
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (editingProduct) {
      setForm({ ...emptyForm, ...editingProduct, price: String(editingProduct.price || ""), costPrice: String(editingProduct.costPrice || ""), images: [] });
      setExistingImages(editingProduct.images || []);
      const standardKeys = Object.keys(emptyForm).concat(["id", "createdAt", "updatedAt", "_id", "__v", "slug", "inStock"]);
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
   * This effect runs ONCE when the component mounts and the cleanup runs ONCE when it unmounts.
   * This ensures images only disappear when you close the form.
   */
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
      blobUrlsRef.current = [];
    };
  }, []); // Empty array = Only cleanup on unmount

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
      blobUrlsRef.current.push(url); // Save to our master list for final cleanup
      return url;
    });

    setForm((prev) => ({ ...prev, images: [...prev.images, ...files] }));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removeNewImage = (index) => {
    // We don't revoke here because it's safer to let the final cleanup handle it
    // to avoid "Preview Unavailable" flickering.
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
        // Pass the admin's user ID when creating a new product
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
        {isWatchCategory && <WatchSpecsSection form={form} setField={setField} />}
        {isPerfumeCategory && <PerfumeSpecsSection form={form} setField={setField} />}
        <CustomFieldsSection customFields={customFields} onAdd={addCustomField} onRemove={removeCustomField} onUpdate={updateCustomField} />
        <InTransitSection form={form} setField={setField} setToggle={setToggle} />
        <button type="submit" disabled={loading} className="w-full rounded-full bg-[var(--foreground)] py-4 text-sm font-bold uppercase tracking-widest text-[var(--surface-strong)] shadow-xl disabled:opacity-50 transition-all active:scale-95">
          {loading ? "Saving to Cloud..." : isEditing ? "Update Product" : "Save Product"}
        </button>
      </form>
    </div>
  );
}
