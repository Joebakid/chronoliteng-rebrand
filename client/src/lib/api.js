import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// HELPER: Convert Firebase Timestamps to plain values for Next.js serialization
const formatFirebaseDoc = (d) => {
  const data = d.data();
  return {
    ...data,
    id: d.id,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || null,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || null,
  };
};

/* ─────────────────────────────────────────────────────────────
   AUTH
───────────────────────────────────────────────────────────── */

export async function apiFetch(endpoint, options = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:5000";
  const res = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload.message || "API request failed");
  return payload;
}

export async function loginUser(credentials) {
  return await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

/* ─────────────────────────────────────────────────────────────
   PRODUCTS
───────────────────────────────────────────────────────────── */

export async function getProducts() {
  const snap = await getDocs(
    query(collection(db, "products"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map(formatFirebaseDoc);
}

export async function getProduct(slug) {
  const q = query(collection(db, "products"), where("slug", "==", slug));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error("Product not found");
  return formatFirebaseDoc(snap.docs[0]);
}

export async function createProduct(data) {
  const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
  const ref = await addDoc(collection(db, "products"), {
    ...data,
    slug,
    createdAt: serverTimestamp(),
  });
  await fetch("/api/revalidate", { method: "POST" }).catch(() => {});
  return { id: ref.id };
}

export async function updateProduct(id, data) {
  const ref = doc(db, "products", id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  await fetch("/api/revalidate", { method: "POST" }).catch(() => {});
  return true;
}

export async function deleteProduct(id) {
  await deleteDoc(doc(db, "products", id));
  await fetch("/api/revalidate", { method: "POST" }).catch(() => {});
  return true;
}

/* ─────────────────────────────────────────────────────────────
   ORDERS
───────────────────────────────────────────────────────────── */

export async function createOrder(orderData) {
  const ref = await addDoc(collection(db, "orders"), {
    ...orderData,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return { id: ref.id };
}

export async function getAdminOrders() {
  const snap = await getDocs(
    query(collection(db, "orders"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map(formatFirebaseDoc);
}

/* ─────────────────────────────────────────────────────────────
   ANALYTICS
───────────────────────────────────────────────────────────── */

export async function getAdminAnalytics() {
  const [productsSnap, ordersSnap] = await Promise.all([
    getDocs(collection(db, "products")),
    getDocs(collection(db, "orders")),
  ]);

  const orders = ordersSnap.docs.map((d) => d.data());
  const prices = productsSnap.docs.map((d) => Number(d.data().price || 0));
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  return {
    totalProducts: productsSnap.size,
    totalOrders: ordersSnap.size,
    totalRevenue,
    averagePrice: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
    highestPrice: prices.length ? Math.max(...prices) : 0,
    totalItemsSold: orders.reduce(
      (sum, o) => sum + (o.items?.reduce((is, i) => is + Number(i.quantity || 0), 0) || 0),
      0
    ),
  };
}