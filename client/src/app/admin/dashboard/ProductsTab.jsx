"use client";

import { useState, useEffect } from "react";
import { createProduct, updateProduct, deleteProduct, toggleProductStock } from "@/lib/api";
import ConfirmModal from "@/components/ConfirmModal";
import PageLoader from "@/components/PageLoader";

const CATEGORIES = ["Watches", "Footwear"];
const MOVEMENTS = ["Quartz", "Mechanical", "Automatic"];
const DEFAULT_CASE_SIZE = "40mm";

const inputCls =
  "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base sm:text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] w-full appearance-none shadow-sm";

const labelCls =
  "text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] ml-1";

const fmt = (n) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

export default function ProductsTab({
  products,
  fetching,
  onRefresh,
  onStatusChange,
}) {
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
    colors: "",
    strapColor: "",
    dialColor: "",
    images: [],
  });

  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [togglingId, setTogglingId] = useState("");
  const [editingId, setEditingId] = useState("");

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    productId: null,
    productName: "",
  });

  const isEditing = Boolean(editingId);
  const isWatchCategory = !form.category || form.category === "Watches";

  useEffect(() => {
    return () => imagePreviews.forEach(URL.revokeObjectURL);
  }, [imagePreviews]);

  const resetForm = () => {
    setForm({
      name: "",
      price: "",
      description: "",
      category: "Watches",
      collection: "",
      caseSize: DEFAULT_CASE_SIZE,
      movement: "",
      powerSource: "",
      strap: "",
      colors: "",
      strapColor: "",
      dialColor: "",
      images: [],
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

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: data }
    );

    const result = await res.json();
    return result.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      let imageUrls = [];

      if (form.images.length > 0) {
        imageUrls = await Promise.all(
          form.images.map((file) => uploadToCloudinary(file))
        );
      }

      const payload = {
        ...form,
        price: Number(form.price),
        colors: form.colors
          ? form.colors.split(",").map((c) => c.trim())
          : [],
        images: isEditing ? [...existingImages, ...imageUrls] : imageUrls,
      };

      if (isEditing) await updateProduct(editingId, payload);
      else await createProduct(payload);

      resetForm();
      onRefresh();

      onStatusChange({
        type: "success",
        message: isEditing ? "Product updated" : "Product uploaded",
      });
    } catch (err) {
      onStatusChange({
        type: "error",
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);

    setExistingImages(product.images || []);

    setForm({
      name: product.name || "",
      price: product.price || "",
      description: product.description || "",
      category: product.category || "Watches",
      collection: product.collection || "",
      caseSize: product.caseSize || DEFAULT_CASE_SIZE,
      movement: product.movement || "",
      powerSource: product.powerSource || "",
      strap: product.strap || "",
      colors: product.colors?.join(", ") || "",
      strapColor: product.strapColor || "",
      dialColor: product.dialColor || "",
      images: [],
    });

    setImagePreviews([]);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteConfirm = async () => {
    const { productId } = confirmModal;

    setDeletingId(productId);

    try {
      await deleteProduct(productId);
      onRefresh();
    } finally {
      setDeletingId("");
      setConfirmModal({ open: false });
    }
  };

  const handleStockToggle = async (product) => {
    setTogglingId(product.id);

    await toggleProductStock(product.id, !product.inStock);

    onRefresh();

    setTogglingId("");
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    setForm((prev) => ({
      ...prev,
      images: files,
    }));

    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const setField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div
      className="
      mx-auto w-full max-w-7xl px-4 py-4
      flex flex-col gap-8
      lg:grid lg:grid-cols-[minmax(0,1fr)_380px]
      xl:grid-cols-[minmax(0,1fr)_420px]
      2xl:grid-cols-[minmax(0,1fr)_460px]
      lg:items-start lg:gap-12
    "
    >
      <ConfirmModal
        open={confirmModal.open}
        title="Delete product?"
        message="Product will be permanently removed"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmModal({ open: false })}
      />

      {/* FORM */}

      <div className="order-1 xl:sticky xl:top-24 space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
          {isEditing ? "Edit product" : "New upload"}
        </h2>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div>
            <label className={labelCls}>Product name</label>

            <input
              value={form.name}
              onChange={setField("name")}
              required
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Price</label>

              <input
                type="number"
                value={form.price}
                onChange={setField("price")}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Category</label>

              <select
                value={form.category}
                onChange={setField("category")}
                className={inputCls}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Description</label>

            <textarea
              rows={3}
              value={form.description}
              onChange={setField("description")}
              className={inputCls}
            />
          </div>

          {/* IMAGE UPLOAD */}

          <div>
            <label className={labelCls}>Images</label>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
            />

            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {imagePreviews.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          <button
            disabled={loading}
            className="w-full rounded-full bg-[var(--foreground)] py-4 text-sm font-bold text-[var(--surface)]"
          >
            {loading
              ? "Processing..."
              : isEditing
              ? "Update Product"
              : "Upload Product"}
          </button>
        </form>
      </div>

      {/* INVENTORY */}

      <div className="order-2 w-full lg:bg-[var(--surface-strong)] lg:p-6 lg:rounded-[2.5rem] lg:border lg:border-[var(--border)]">
        <h2 className="mb-6 text-sm font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
          Inventory ({products.length})
        </h2>

        <div className="grid gap-4 max-h-[75vh] overflow-y-auto pr-1">
          {fetching ? (
            <PageLoader text="Syncing..." />
          ) : (
            products.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-4 rounded-[2rem] border border-[var(--border)] p-5 bg-[var(--surface)]"
              >
                <div className="flex items-start gap-4">
                  {p.images?.[0] && (
                    <img
                      src={p.images[0]}
                      className="w-14 h-14 sm:w-18 md:w-20 md:h-20 rounded-xl object-cover"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-2 text-[15px] font-bold">
                      {p.name}
                    </p>

                    <p className="text-sm text-[var(--muted)]">
                      {fmt(p.price)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]/30">
                  <button
                    onClick={() => handleStockToggle(p)}
                    className="px-4 py-2 text-xs border rounded-xl"
                  >
                    {p.inStock ? "Hide" : "Show"}
                  </button>

                  <button
                    onClick={() => handleEdit(p)}
                    className="px-4 py-2 text-xs border rounded-xl"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      setConfirmModal({
                        open: true,
                        productId: p.id,
                      })
                    }
                    className="px-4 py-2 text-xs border rounded-xl text-red-500"
                  >
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