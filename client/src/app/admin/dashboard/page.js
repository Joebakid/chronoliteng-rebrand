"use client";

import { useEffect, useState, useRef } from "react";
import {
  getProducts,
  getAdminAnalytics,
  getUsers,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStock,
} from "@/lib/api";
import ConfirmModal from "@/components/ConfirmModal";
import PageLoader from "@/components/PageLoader";

const CATEGORIES = ["Watches", "Footwear"];
const MOVEMENTS = ["Quartz", "Mechanical", "Automatic"];
const POWER_SOURCES = ["Battery", "Self-winding (Automatic)", "Manual-winding"];
const DEFAULT_CASE_SIZE = "40mm";
const TABS = ["Products", "Users"];

const inputCls =
  "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-base sm:text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] w-full";
const labelCls =
  "text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]";

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Products");
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
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
  const [togglingId, setTogglingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    productId: null,
    productName: "",
    productRevenue: 0,
  });
  const [analytics, setAnalytics] = useState({
    totalProducts: 0,
    totalCategories: 0,
    averagePrice: 0,
    highestPrice: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalItemsSold: 0,
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

  const fetchAll = async () => {
    setFetching(true);
    try {
      const [productsData, analyticsData, usersData] = await Promise.all([
        getProducts(),
        getAdminAnalytics(),
        getUsers(),
      ]);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setAnalytics(analyticsData);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Unable to load data." });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const uploadToCloudinary = async (file) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset)
      throw new Error("Cloudinary environment variables are missing.");
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", uploadPreset);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: data }
    );
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
      fetchAll();
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

  const handleDeleteClick = (product) => {
    setConfirmModal({
      open: true,
      productId: product.id,
      productName: product.name,
      productRevenue: Number(product.price || 0),
    });
  };

  const handleDeleteConfirm = async ({ removeRevenue }) => {
    const { productId } = confirmModal;
    setConfirmModal({ open: false, productId: null, productName: "", productRevenue: 0 });
    setDeletingId(productId);
    try {
      await deleteProduct(productId);
      setStatus({ type: "success", message: "Product deleted." });
      fetchAll();
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Delete failed." });
    } finally {
      setDeletingId("");
    }
  };

  const handleStockToggle = async (product) => {
    setTogglingId(product.id);
    try {
      await toggleProductStock(product.id, !product.inStock);
      setStatus({
        type: "success",
        message: `"${product.name}" marked as ${!product.inStock ? "in stock" : "out of stock"}.`,
      });
      fetchAll();
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Stock update failed." });
    } finally {
      setTogglingId("");
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
    setForm((prev) => { const updated = [...prev.images]; updated.splice(index, 1); return { ...prev, images: updated }; });
    setImagePreviews((prev) => { const updated = [...prev]; updated.splice(index, 1); return updated; });
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => { const updated = [...prev]; updated.splice(index, 1); return updated; });
  };

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const fmt = (n) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-8">
      <ConfirmModal
        open={confirmModal.open}
        title="Delete product?"
        message={`"${confirmModal.productName}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        withRevenueOption
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmModal({ open: false, productId: null, productName: "", productRevenue: 0 })}
      />

      {status.message && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-medium ${status.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
          {status.message}
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Products", value: fetching ? null : analytics.totalProducts || products.length },
          { label: "Orders", value: fetching ? null : analytics.totalOrders },
          { label: "Revenue", value: fetching ? null : fmt(analytics.totalRevenue) },
          { label: "Items Sold", value: fetching ? null : analytics.totalItemsSold },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">{label}</p>
            {value === null ? (
              <div className="mt-3 h-7 w-16 rounded-lg bg-[var(--border)] animate-pulse" />
            ) : (
              <p className="mt-3 text-2xl font-semibold">{value}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 border-b border-[var(--border)]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold uppercase tracking-[0.16em] transition border-b-2 -mb-px ${
              activeTab === tab
                ? "border-[var(--foreground)] text-[var(--foreground)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          Products Tab
      ══════════════════════════════════════ */}
      {activeTab === "Products" && (
        <div className="grid gap-10 xl:grid-cols-2">
          <div>
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              {isEditing ? "Edit product" : "Upload product"}
            </h2>
            <form onSubmit={handleSubmit} className="grid gap-4" style={{ touchAction: "manipulation" }}>
              <div className="grid gap-1.5">
                <label className={labelCls}>Product name</label>
                <input value={form.name} onChange={setField("name")} placeholder="Chronolite Executive" required className={inputCls} />
              </div>
              <div className="grid gap-1.5">
                <label className={labelCls}>Price</label>
                <input type="number" inputMode="numeric" value={form.price} onChange={setField("price")} required className={inputCls} />
              </div>
              <div className="grid gap-1.5">
                <label className={labelCls}>Description</label>
                <textarea required rows={4} value={form.description} onChange={setField("description")} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <label className={labelCls}>Category</label>
                  <select value={form.category} onChange={setField("category")} className={inputCls}>
                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <label className={labelCls}>Collection</label>
                  <input value={form.collection} onChange={setField("collection")} placeholder="Heritage" className={inputCls} />
                </div>
              </div>

              {isWatchCategory && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <label className={labelCls}>Movement</label>
                      <select value={form.movement} onChange={setField("movement")} className={inputCls}>
                        <option value="" disabled>Select movement</option>
                        {MOVEMENTS.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="grid gap-1.5">
                      <label className={labelCls}>Power source</label>
                      <select value={form.powerSource} onChange={setField("powerSource")} className={inputCls}>
                        <option value="" disabled>Select power source</option>
                        {POWER_SOURCES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <label className={labelCls}>Case size</label>
                      <input value={form.caseSize} onChange={setField("caseSize")} placeholder={DEFAULT_CASE_SIZE} className={inputCls} />
                    </div>
                    <div className="grid gap-1.5">
                      <label className={labelCls}>Strap material</label>
                      <input value={form.strap} onChange={setField("strap")} placeholder="Leather" className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <label className={labelCls}>Dial color</label>
                      <input value={form.dialColor} onChange={setField("dialColor")} placeholder="Midnight Black" className={inputCls} />
                    </div>
                    <div className="grid gap-1.5">
                      <label className={labelCls}>Strap color</label>
                      <input value={form.strapColor} onChange={setField("strapColor")} placeholder="Tan Brown" className={inputCls} />
                    </div>
                  </div>
                </>
              )}

              <div className="grid gap-1.5">
                <label className={labelCls}>Available colors (comma-separated)</label>
                <input value={form.colors} onChange={setField("colors")} placeholder="Black, Silver, Gold" className={inputCls} />
              </div>

              <div className="grid gap-2">
                <label className={labelCls}>Images</label>
                <input
                  type="file" multiple accept="image/*" required={!isEditing}
                  className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-base sm:text-sm cursor-pointer file:mr-3 file:rounded-full file:border-0 file:bg-[var(--foreground)] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[var(--surface-strong)]"
                  onChange={handleImageChange}
                />
                {existingImages.length > 0 && (
                  <div className="mt-1">
                    <p className="mb-2 text-xs text-[var(--muted)] uppercase tracking-widest">Current images</p>
                    <div className="flex flex-wrap gap-2">
                      {existingImages.map((url, i) => (
                        <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-[var(--border)]">
                          <img src={url} alt={`existing-${i}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeExistingImage(i)} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {imagePreviews.length > 0 && (
                  <div className="mt-1">
                    <p className="mb-2 text-xs text-[var(--muted)] uppercase tracking-widest">New images</p>
                    <div className="flex flex-wrap gap-2">
                      {imagePreviews.map((src, i) => (
                        <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-[var(--border)]">
                          <img src={src} alt={`preview-${i}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeNewPreview(i)} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-1">
                <button disabled={loading} className="flex-1 rounded-full bg-[var(--foreground)] py-3 text-sm font-semibold text-[var(--surface-strong)] disabled:opacity-60 transition">
                  {loading ? "Processing..." : isEditing ? "Save changes" : "Upload"}
                </button>
                {isEditing && (
                  <button type="button" onClick={resetForm} className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold transition hover:bg-[var(--surface)]">Cancel</button>
                )}
              </div>
            </form>
          </div>

          {/* ── Current Products ── */}
          <div>
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Current products ({products.length})
            </h2>
            <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] overflow-hidden">
              {fetching ? (
                <PageLoader text="Loading products" />
              ) : products.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-[var(--muted)]">No products yet.</div>
              ) : (
                products.map((p) => (
                  <div key={p.id} className="p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      {Array.isArray(p.images) && p.images[0] ? (
                        <img src={p.images[0]} alt={p.name} className="w-14 h-14 rounded-xl object-cover border border-[var(--border)] flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex-shrink-0 flex items-center justify-center text-[var(--muted)] text-[10px]">No img</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold leading-snug">{p.name}</p>
                        <p className="mt-0.5 text-sm font-medium text-[var(--muted)]">{fmt(p.price)}</p>
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          {p.category && <span className="text-[0.62rem] text-[var(--muted)] opacity-70">{p.category}</span>}
                          <span className={`text-[0.62rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${p.inStock ? "bg-green-100 text-green-700" : "bg-[var(--surface)] text-[var(--muted)]"}`}>
                            {p.inStock ? "In stock" : "Hidden"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleStockToggle(p)}
                        disabled={togglingId === p.id}
                        className={`flex-1 rounded-full border py-2 text-xs font-semibold transition disabled:opacity-50 ${p.inStock ? "border-green-300 text-green-700 hover:bg-green-50" : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface)]"}`}
                      >
                        {togglingId === p.id ? "…" : p.inStock ? "Hide" : "Show"}
                      </button>
                      <button onClick={() => handleEdit(p)} className="flex-1 rounded-full border border-[var(--border)] py-2 text-xs font-semibold transition hover:bg-[var(--surface)]">Edit</button>
                      <button
                        onClick={() => handleDeleteClick(p)}
                        disabled={deletingId === p.id}
                        className="flex-1 rounded-full border border-[var(--border)] py-2 text-xs font-semibold text-[var(--danger)] transition hover:bg-[var(--surface)] disabled:opacity-50"
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
      )}

      {/* ══════════════════════════════════════
          Users Tab
      ══════════════════════════════════════ */}
      {activeTab === "Users" && (
        <div>
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Registered users ({users.length})
          </h2>
          <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] overflow-hidden">
            {fetching ? (
              <PageLoader text="Loading users" />
            ) : users.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[var(--muted)]">No users yet.</div>
            ) : (
              users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-9 w-9 rounded-full bg-[var(--surface)] border border-[var(--border)] flex-shrink-0 flex items-center justify-center text-xs font-bold text-[var(--muted)] uppercase">
                    {u.name?.[0] || u.email?.[0] || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u.name || "—"}</p>
                    <p className="text-xs text-[var(--muted)] truncate">{u.email}</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {u.isAdmin && (
                      <span className="text-[0.62rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-[var(--surface)] text-[var(--muted)]">Admin</span>
                    )}
                    <p className="text-xs text-[var(--muted)]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-NG") : "—"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}