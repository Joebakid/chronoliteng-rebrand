"use client";

import { useEffect, useState } from "react";
import { apiFetch, getAdminAnalytics, getAdminOrders } from "@/lib/api";
import { clearAdminToken, getAdminToken } from "@/lib/adminAuth";
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

  useEffect(() => {
    return () => {
      imagePreviews.forEach(URL.revokeObjectURL);
    };
  }, [imagePreviews]);
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
      const data = await apiFetch("/products", {
        fallbackMessage: "Unable to load products.",
      });
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

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => {
    if (!token) return;
    getAdminAnalytics(token)
      .then(setAnalytics)
      .catch((err) => setStatus({ type: "error", message: err.message }));
    fetchOrders();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (!value) return;
      if (key === "images" && Array.isArray(value)) {
        value.forEach((file) => {
          if (file) {
            formData.append("images", file);
          }
        });
        return;
      }
      formData.append(key, value);
    });
    try {
      await apiFetch(isEditing ? `/products/${editingId}` : "/products", {
        method: isEditing ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        fallbackMessage: isEditing ? "Update failed." : "Upload failed.",
      });
      resetForm();
      setStatus({ type: "success", message: isEditing ? "Product updated." : "Product uploaded." });
      fetchProducts();
      getAdminAnalytics(token).then(setAnalytics).catch(() => {});
    } catch (err) {
      if (err.status === 401) {
        clearAdminToken();
      }
      setStatus({
        type: "error",
        message: err.message || (isEditing ? "Update failed." : "Upload failed."),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
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
    setDeletingId(id);
    try {
      await apiFetch(`/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        fallbackMessage: "Delete failed.",
      });
      setStatus({ type: "success", message: "Product deleted." });
      fetchProducts();
      getAdminAnalytics(token).then(setAnalytics).catch(() => {});
    } catch (err) {
      if (err.status === 401) {
        clearAdminToken();
      }
      setStatus({ type: "error", message: err.message || "Delete failed." });
    } finally {
      setDeletingId("");
    }
  };

  const fmt = (n) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
  const formatOrderDate = (value) =>
    new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  const copyField = (label, key, props = {}) => (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">{label}</label>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(form[key] || "");
          }}
          className="text-[0.56rem] uppercase tracking-[0.3em] text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          Copy
        </button>
      </div>
      <input
        value={form[key] || ""}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
        {...props}
      />
    </div>
  );

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

  return (
    <div className="space-y-10">

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Products", value: fetching ? "—" : analytics.totalProducts },
          { label: "Categories", value: fetching ? "—" : analytics.totalCategories },
          { label: "Orders", value: fetching ? "—" : analytics.totalOrders },
          { label: "Revenue", value: fetching ? "—" : fmt(analytics.totalRevenue) },
          { label: "Avg price", value: fetching ? "—" : fmt(analytics.averagePrice) },
          { label: "Highest", value: fetching ? "—" : fmt(analytics.highestPrice) },
          { label: "Items sold", value: fetching ? "—" : analytics.totalItemsSold },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">{label}</p>
            <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
          </div>
        ))}
      </div>

      {/* Status */}
      {status.message && (
        <p className={`text-sm ${status.type === "error" ? "text-[var(--danger)]" : "text-[var(--foreground)]"}`}>
          {status.message}
        </p>
      )}

      <div className="grid gap-10 xl:grid-cols-2">

        {/* Upload form */}
        <div>
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              {isEditing ? "Edit product" : "Upload product"}
            </h2>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)]"
              >
                Cancel edit
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {field("Product name", "name", { placeholder: "Chronolite Executive", required: true })}
            {field("Price", "price", { placeholder: "320000", type: "number", required: true })}

            <div className="grid gap-1.5">
              <label className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Description</label>
              <textarea
                required rows={4}
                value={form.description}
                placeholder="Short product description."
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {field("Category", "category", { placeholder: "Watches" })}
              {field("Collection", "collection", { placeholder: "Signature Series" })}
              {field("Case size", "caseSize", { placeholder: "40mm" })}
              {field("Movement", "movement", { placeholder: "Quartz" })}
            </div>

            {field("Strap", "strap", { placeholder: "Italian leather" })}
            {field("Strap color", "strapColor", { placeholder: "Brown" })}
            {field("Dial color", "dialColor", { placeholder: "Black" })}
            {copyField("Colours", "colors", { placeholder: "red, white, steel" })}

            <div className="grid gap-1.5">
              <label className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                Images
              </label>
            <input
                type="file"
                multiple
                required={!isEditing}
                className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--foreground)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--surface-strong)]"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setForm({ ...form, images: files });
                  setImagePreviews((prev) => {
                    prev.forEach(URL.revokeObjectURL);
                    return files.map((file) => URL.createObjectURL(file));
                  });
                }}
              />
              {isEditing && (
                <p className="text-xs text-[var(--muted)]">
                  Leave this empty to keep the current product photos.
                </p>
              )}
              {imagePreviews.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {imagePreviews.map((src, index) => (
                    <img
                      key={index}
                      src={src}
                      alt={`Preview ${index + 1}`}
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                  ))}
                </div>
              )}
            </div>

            <button
              disabled={loading}
              className="mt-1 rounded-full bg-[var(--foreground)] py-2.5 text-sm font-semibold text-[var(--surface-strong)] transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? (isEditing ? "Saving..." : "Uploading...") : isEditing ? "Save changes" : "Upload"}
            </button>
          </form>
        </div>

        {/* Product list */}
        <div>
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Current products {!fetching && <span className="ml-1 text-[var(--foreground)]">({products.length})</span>}
          </h2>

          {fetching ? (
            <p className="text-sm text-[var(--muted)]">Loading...</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No products yet.</p>
          ) : (
            <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] overflow-hidden">
              {products.map((p) => (
                <div key={p._id} className="flex items-center justify-between gap-4 px-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">{p.name}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">{fmt(p.price)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(p)}
                      className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p._id)}
                      disabled={deletingId === p._id}
                      className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--danger)] transition hover:bg-[rgba(161,69,59,0.08)] disabled:opacity-50"
                    >
                      {deletingId === p._id ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <div>
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          Recent orders {!fetching && <span className="ml-1 text-[var(--foreground)]">({orders.length})</span>}
        </h2>

        {orders.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <article
                key={order._id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-5"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      {formatOrderDate(order.createdAt)}
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]">
                      {order.user?.name || "Customer"} ({order.user?.email || "Unknown email"})
                    </h3>
                  </div>
                  <p className="text-base font-semibold text-[var(--price)]">
                    {fmt(order.total)}
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={`${order._id}-${item.slug}`}
                      className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-[var(--foreground)]">{item.name}</p>
                        <p className="text-[var(--muted)]">
                          Qty {item.quantity} x {fmt(item.price)}
                        </p>
                      </div>
                      <p className="font-semibold text-[var(--foreground)]">
                        {fmt(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
