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

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({
    name: "", price: "", description: "", category: "",
    collection: "", caseSize: "", movement: "", strap: "", colors: "",
    strapColor: "", dialColor: "", images: [],
  });
  const [imagePreviews, setImagePreviews] = useState([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState("");

  const [analytics, setAnalytics] = useState({
    totalProducts: 0, totalCategories: 0, averagePrice: 0,
    highestPrice: 0, totalOrders: 0, totalRevenue: 0, totalItemsSold: 0,
  });

  const token = getAdminToken() || getStoredUserSession()?.token || "";
  const isEditing = Boolean(editingId);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => imagePreviews.forEach(URL.revokeObjectURL);
  }, [imagePreviews]);

  const resetForm = () => {
    setForm({
      name: "", price: "", description: "", category: "",
      collection: "", caseSize: "", movement: "", strap: "", colors: "",
      strapColor: "", dialColor: "", images: [],
    });
    setImagePreviews([]);
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

  /* CLOUDINARY UPLOAD LOGIC USING ENV VARS */
  const uploadToCloudinary = async (file) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary environment variables are missing.");
    }

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
        imageUrls = await Promise.all(
          form.images.map((file) => uploadToCloudinary(file))
        );
      }

      const payload = {
        ...form,
        price: Number(form.price),
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
    setForm({
      name: product.name || "",
      price: String(product.price || ""),
      description: product.description || "",
      category: product.category || "",
      collection: product.collection || "",
      caseSize: product.caseSize || "",
      movement: product.movement || "",
      strap: product.strap || "",
      colors: Array.isArray(product.colors) ? product.colors.join(", ") : "",
      strapColor: product.strapColor || "",
      dialColor: product.dialColor || "",
      images: [],
    });
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

  const fmt = (n) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
  const formatOrderDate = (value) => new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

  const field = (label, key, props = {}) => (
    <div key={key} className="grid gap-1.5">
      <label className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">{label}</label>
      <input
        value={form[key] || ""}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
        {...props}
      />
    </div>
  );

  const copyField = (label, key, props = {}) => (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">{label}</label>
        <button type="button" onClick={() => navigator.clipboard.writeText(form[key] || "")} className="text-[0.56rem] uppercase tracking-[0.3em] text-[var(--muted)] transition hover:text-[var(--foreground)]">Copy</button>
      </div>
      <input
        value={form[key] || ""}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
        {...props}
      />
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Products", value: fetching ? "—" : analytics.totalProducts },
          { label: "Orders", value: fetching ? "—" : analytics.totalOrders },
          { label: "Revenue", value: fetching ? "—" : fmt(analytics.totalRevenue) },
          { label: "Items sold", value: fetching ? "—" : analytics.totalItemsSold },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">{label}</p>
            <p className="mt-3 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-10 xl:grid-cols-2">
        {/* Upload Form */}
        <div>
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">{isEditing ? "Edit product" : "Upload product"}</h2>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {field("Product name", "name", { placeholder: "Chronolite Executive", required: true })}
            {field("Price", "price", { type: "number", required: true })}
            <div className="grid gap-1.5">
              <label className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Description</label>
              <textarea required rows={4} value={form.description} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm" onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {field("Category", "category")}
              {field("Collection", "collection")}
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Images</label>
              <input type="file" multiple required={!isEditing} className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm" onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setForm({ ...form, images: files });
                setImagePreviews(files.map(f => URL.createObjectURL(f)));
              }} />
            </div>
            <button disabled={loading} className="mt-1 rounded-full bg-[var(--foreground)] py-2.5 text-sm font-semibold text-[var(--surface-strong)] disabled:opacity-60">
              {loading ? "Processing..." : isEditing ? "Save changes" : "Upload"}
            </button>
          </form>
        </div>

        {/* Product List */}
        <div>
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Current products ({products.length})</h2>
          <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] overflow-hidden">
            {products.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-[var(--muted)]">{fmt(p.price)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(p)} className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold">Edit</button>
                  <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--danger)]">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}