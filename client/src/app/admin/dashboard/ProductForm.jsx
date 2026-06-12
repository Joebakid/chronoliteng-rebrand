"use client";

import { useState, useEffect, useRef, useMemo } from "react";
// Added getProducts to extract legacy suppliers
import { createProduct, updateProduct, getCategories, getSuppliers, createSupplier, getProducts } from "@/lib/api";
import CoreDetailsSection from "./CoreDetailsSection";
import WatchSpecsSection from "./WatchSpecsSection";
import PerfumeSpecsSection from "./PerfumeSpecsSection";
import GoldSpecsSection from "./GoldSpecsSection";
import CustomFieldsSection from "./CustomFieldsSection";
import InTransitSection from "./InTransitSection";
import ImageUploader from "./ImageUploader";

const emptyForm = {
  name: "", price: "", costPrice: "", description: "", category: "",
  collection: "", images: [], inTransit: false, transitNote: "",
  caseSize: "40mm", movement: "Quartz", powerSource: "Battery",
  dialColor: "", strapColor: "All", perfumeSize: "",
  weight: "", source: "", 
};

const MAIN_ADMIN_EMAIL = "josephbawo@gmail.com";

export default function ProductForm({ editingProduct, onSuccess, onCancel, onStatusChange, user }) {
  const [form, setForm] = useState(emptyForm);
  const [customFields, setCustomFields] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState(["Watches", "Perfumes"]);

  // --- SUPPLIER STATES ---
  const [dbSuppliers, setDbSuppliers] = useState([]);
  const [legacySources, setLegacySources] = useState([]); // Stores old suppliers not in DB
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [savingSupplier, setSavingSupplier] = useState(false);

  const blobUrlsRef = useRef([]);

  const isEditing = Boolean(editingProduct);
  const categoryLower = (form.category || "").toLowerCase();
  const isWatchCategory = categoryLower === "watches";
  const isPerfumeCategory = categoryLower === "perfumes" || categoryLower === "perfume";
  const isGoldCategory = categoryLower === "gold" || categoryLower === "gold replica";

  // Fetch Categories
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
  }, [user?.id, user?.email, editingProduct, form.category]);

  // --- FETCH BOTH OFFICIAL SUPPLIERS & LEGACY SOURCES ---
  useEffect(() => {
    // 1. Get official suppliers from new DB table
    getSuppliers()
      .then((data) => {
        if (Array.isArray(data)) setDbSuppliers(data);
      })
      .catch((err) => console.error("Failed to load suppliers", err));

    // 2. Get all products to extract legacy typed-in suppliers
    getProducts(user?.id, user?.email)
      .then((data) => {
        if (Array.isArray(data)) {
          const sources = new Set();
          data.forEach((p) => {
            if (p.source && p.source.trim() !== "") {
              sources.add(p.source.trim());
            }
          });
          setLegacySources(Array.from(sources));
        }
      })
      .catch((err) => console.error("Failed to extract legacy sources", err));
  }, [user?.id, user?.email]);

  // --- COMBINE THEM INTO ONE MASTER LIST ---
  const allSuppliers = useMemo(() => {
    const combinedSet = new Set([
      ...dbSuppliers.map((s) => s.name),
      ...legacySources
    ]);
    return Array.from(combinedSet).sort((a, b) => a.localeCompare(b));
  }, [dbSuppliers, legacySources]);

  useEffect(() => {
    if (editingProduct) {
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
  }, [editingProduct, categories]);

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

  const handleCreateSupplier = async () => {
    if (!newSupplierName.trim()) return;
    setSavingSupplier(true);
    try {
      const created = await createSupplier(newSupplierName.trim());
      setDbSuppliers((prev) => [...prev, created]);
      setForm((prev) => ({ ...prev, source: created.name })); 
      setNewSupplierName("");
      setIsAddingSupplier(false);
      onStatusChange({ type: "success", message: "Supplier added successfully!" });
    } catch (err) {
      onStatusChange({ type: "error", message: err.message || "Failed to add supplier." });
    } finally {
      setSavingSupplier(false);
    }
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

        {/* --- DYNAMIC SUPPLIER INFO SECTION --- */}
        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]/30 p-4 sm:p-5 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)] px-1">Supplier Info</p>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] ml-1">Distributor / Source</label>
            
            {isAddingSupplier ? (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="e.g. Lagos Market..."
                  className="flex-1 appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] shadow-sm"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreateSupplier}
                  disabled={savingSupplier || !newSupplierName.trim()}
                  className="px-4 py-3 bg-[var(--foreground)] text-[var(--surface)] text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 disabled:opacity-50 transition"
                >
                  {savingSupplier ? "..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingSupplier(false)}
                  className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-700 transition"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  value={form.source || ""}
                  onChange={setField("source")}
                  className="flex-1 appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] shadow-sm"
                >
                  <option value="">-- No Supplier Assigned --</option>
                  {allSuppliers.map((supplierName) => (
                    <option key={supplierName} value={supplierName}>{supplierName}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsAddingSupplier(true)}
                  className="px-4 py-3 border border-dashed border-[var(--border)] text-[var(--foreground)] text-[10px] font-bold uppercase tracking-widest rounded-xl hover:border-[var(--accent)] hover:text-[var(--accent)] transition whitespace-nowrap"
                >
                  + New
                </button>
              </div>
            )}
            
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