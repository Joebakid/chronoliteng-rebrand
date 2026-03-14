"use client";

import { useEffect, useState } from "react";
import {
  getProducts,
  getAdminAnalytics,
  getAdminOrders,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";
import { getStoredUserSession } from "@/lib/userAuth";

const CATEGORIES = ["Watches", "Footwear"];
const MOVEMENTS = ["Quartz", "Mechanical", "Automatic"];
const POWER_SOURCES = ["Battery", "Self-winding (Automatic)", "Manual-winding"];
const DEFAULT_CASE_SIZE = "40mm";

const inputCls =
  "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] w-full";

const labelCls =
  "text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]";

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
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
  const [fetching, setFetching] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState("");

  const [analytics, setAnalytics] = useState({
    totalProducts: 0,
    totalCategories: 0,
    averagePrice: 0,
    highestPrice: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalItemsSold: 0,
  });

  const token = getAdminToken() || getStoredUserSession()?.token || "";
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

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Unable to load products." });
    } finally {
      setFetching(false);
    }
  };

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const data = await getAdminOrders(token);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Unable to load orders." });
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!token) return;
    getAdminAnalytics(token)
      .then(setAnalytics)
      .catch((err) => setStatus({ type: "error", message: err.message }));
    fetchOrders();
  }, [token]);

  const uploadToCloudinary = async (file) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) throw new Error("Cloudinary environment variables are missing.");
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", uploadPreset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: data,
    });
    if (!res.ok) throw new Error("Cloudinary upload failed");
    const result = await res.json();
    return result.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });
    try {
      let imageUrls = [];
      if (form.images.length > 0) {
        imageUrls = await Promise.all(form.images.map((file) => uploadToCloudinary(file)));
      }
      const payload = {
        ...form,
        price: Number(form.price),
        category: form.category || "Watches",
        colors: form.colors ? form.colors.split(",").map((c) => c.trim()) : [],
        images: imageUrls.length > 0 ? imageUrls : undefined,
      };
      if (isEditing) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }
      resetForm();
      setStatus({ type: "success", message: isEditing ? "Product updated." : "Product uploaded." });
      fetchProducts();
      getAdminAnalytics(token).then(setAnalytics).catch(() => {});
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Operation failed." });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setExistingImages(Array.isArray(product.images) ? product.images : []);
    setForm({
      name: product.name || "",
      price: String(product.price || ""),
      description: product.description || "",
      category: product.category || "Watches",
      collection: product.collection || "",
      caseSize: product.caseSize || DEFAULT_CASE_SIZE,
      movement: product.movement || "",
      powerSource: product.powerSource || "",
      strap: product.strap || "",
      colors: Array.isArray(product.colors) ? product.colors.join(", ") : "",
      strapColor: product.strapColor || "",
      dialColor: product.dialColor || "",
      images: [],
    });
    setImagePreviews([]);
    setStatus({ type: "", message: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    setDeletingId(id);
    try {
      await deleteProduct(id);
      setStatus({ type: "success", message: "Product deleted." });
      fetchProducts();
      getAdminAnalytics(token).then(setAnalytics).catch(() => {});
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Delete failed." });
    } finally {
      setDeletingId("");
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    imagePreviews.forEach(URL.revokeObjectURL);
    setForm((prev) => ({ ...prev, images: files }));
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeNewPreview = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setForm((prev) => {
      const updated = [...prev.images];
      updated.splice(index, 1);
      return { ...prev, images: updated };
    });
    setImagePreviews((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  // Stable onChange handlers — use functional updater so no stale closures
  const setField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const fmt = (n) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="space-y-10">
      {/* Status Banner */}
      {status.message && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-medium ${
            status.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-green-50 text-green-700 border border-green-200"
          }`}
        >
          {status.message}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Products", value: fetching ? "—" : analytics.totalProducts },
          { label: "Orders", value: fetching ? "—" : analytics.totalOrders },
          { label: "Revenue", value: fetching ? "—" : fmt(analytics.totalRevenue) },
          { label: "Items Sold", value: fetching ? "—" : analytics.totalItemsSold },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-5"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">{label}</p>
            <p className="mt-3 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-10 xl:grid-cols-2">
        {/* ── Form ── */}
        <div>
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            {isEditing ? "Edit product" : "Upload product"}
          </h2>

          <form onSubmit={handleSubmit} className="grid gap-4">
            {/* Product Name */}
            <div className="grid gap-1.5">
              <label className={labelCls}>Product name</label>
              <input
                value={form.name}
                onChange={setField("name")}
                placeholder="Chronolite Executive"
                required
                className={inputCls}
              />
            </div>

            {/* Price */}
            <div className="grid gap-1.5">
              <label className={labelCls}>Price</label>
              <input
                type="number"
                value={form.price}
                onChange={setField("price")}
                required
                className={inputCls}
              />
            </div>

            {/* Description */}
            <div className="grid gap-1.5">
              <label className={labelCls}>Description</label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={setField("description")}
                className={inputCls}
              />
            </div>

            {/* Category + Collection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <label className={labelCls}>Category</label>
                <select
                  value={form.category}
                  onChange={setField("category")}
                  className={inputCls}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1.5">
                <label className={labelCls}>Collection</label>
                <input
                  value={form.collection}
                  onChange={setField("collection")}
                  placeholder="Heritage"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Watch-only fields */}
            {isWatchCategory && (
              <>
                {/* Movement + Power Source */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <label className={labelCls}>Movement</label>
                    <select
                      value={form.movement}
                      onChange={setField("movement")}
                      className={inputCls}
                    >
                      <option value="" disabled>
                        Select movement
                      </option>
                      {MOVEMENTS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-1.5">
                    <label className={labelCls}>Power source</label>
                    <select
                      value={form.powerSource}
                      onChange={setField("powerSource")}
                      className={inputCls}
                    >
                      <option value="" disabled>
                        Select power source
                      </option>
                      {POWER_SOURCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Case Size + Strap */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <label className={labelCls}>Case size</label>
                    <input
                      value={form.caseSize}
                      onChange={setField("caseSize")}
                      placeholder={DEFAULT_CASE_SIZE}
                      className={inputCls}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label className={labelCls}>Strap material</label>
                    <input
                      value={form.strap}
                      onChange={setField("strap")}
                      placeholder="Leather"
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Dial Color + Strap Color */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <label className={labelCls}>Dial color</label>
                    <input
                      value={form.dialColor}
                      onChange={setField("dialColor")}
                      placeholder="Midnight Black"
                      className={inputCls}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label className={labelCls}>Strap color</label>
                    <input
                      value={form.strapColor}
                      onChange={setField("strapColor")}
                      placeholder="Tan Brown"
                      className={inputCls}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Available Colors */}
            <div className="grid gap-1.5">
              <label className={labelCls}>Available colors (comma-separated)</label>
              <input
                value={form.colors}
                onChange={setField("colors")}
                placeholder="Black, Silver, Gold"
                className={inputCls}
              />
            </div>

            {/* Image Upload */}
            <div className="grid gap-2">
              <label className={labelCls}>Images</label>
              <input
                type="file"
                multiple
                accept="image/*"
                required={!isEditing}
                className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm cursor-pointer file:mr-3 file:rounded-full file:border-0 file:bg-[var(--foreground)] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[var(--surface-strong)]"
                onChange={handleImageChange}
              />

              {/* Existing images (edit mode) */}
              {existingImages.length > 0 && (
                <div className="mt-1">
                  <p className="mb-2 text-xs text-[var(--muted)] uppercase tracking-widest">
                    Current images
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {existingImages.map((url, i) => (
                      <div
                        key={i}
                        className="relative group w-20 h-20 rounded-xl overflow-hidden border border-[var(--border)]"
                      >
                        <img
                          src={url}
                          alt={`existing-${i}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(i)}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-1">
                  <p className="mb-2 text-xs text-[var(--muted)] uppercase tracking-widest">
                    New images
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {imagePreviews.map((src, i) => (
                      <div
                        key={i}
                        className="relative group w-20 h-20 rounded-xl overflow-hidden border border-[var(--border)]"
                      >
                        <img
                          src={src}
                          alt={`preview-${i}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewPreview(i)}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit / Cancel */}
            <div className="flex gap-3 mt-1">
              <button
                disabled={loading}
                className="flex-1 rounded-full bg-[var(--foreground)] py-2.5 text-sm font-semibold text-[var(--surface-strong)] disabled:opacity-60 transition"
              >
                {loading ? "Processing..." : isEditing ? "Save changes" : "Upload"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold transition hover:bg-[var(--surface)]"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── Product List ── */}
        <div>
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Current products ({products.length})
          </h2>
          <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] overflow-hidden">
            {fetching ? (
              <div className="px-4 py-8 text-center text-sm text-[var(--muted)]">Loading…</div>
            ) : products.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[var(--muted)]">No products yet.</div>
            ) : (
              products.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  {Array.isArray(p.images) && p.images[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="w-12 h-12 rounded-xl object-cover border border-[var(--border)] flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex-shrink-0 flex items-center justify-center text-[var(--muted)] text-[10px]">
                      No img
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {fmt(p.price)}
                      {p.category && (
                        <span className="ml-2 opacity-60">{p.category}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(p)}
                      className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold transition hover:bg-[var(--surface)]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                      className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--danger)] transition hover:bg-[var(--surface)] disabled:opacity-50"
                    >
                      {deletingId === p.id ? "…" : "Delete"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}