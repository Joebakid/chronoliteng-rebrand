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
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// HELPER: Convert Firebase Timestamps to plain values for Next.js
const formatFirebaseDoc = (d) => {
  const data = d.data();
  return {
    ...data,
    id: d.id,
    // Fix: Convert Firebase Timestamps to ISO strings
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || null,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || null,
  };
};

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
  const snap = await getDocs(collection(db, "products"));
  const match = snap.docs.find((d) => d.data().slug === slug);

  if (!match) throw new Error("Product not found");
  return formatFirebaseDoc(match);
}

export async function createProduct(data) {
  // Ensure the product has a slug based on the name if not provided
  const slug = data.slug || data.name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
  
  const ref = await addDoc(collection(db, "products"), {
    ...data,
    slug,
    createdAt: serverTimestamp(),
  });

  return { id: ref.id };
}

export async function updateProduct(id, data) {
  const ref = doc(db, "products", id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  return true;
}

export async function deleteProduct(id) {
  const ref = doc(db, "products", id);
  await deleteDoc(ref);
  return true;
}

/* ─────────────────────────────────────────────────────────────
   ORDERS / ANALYTICS (Fixed to match the logic above)
───────────────────────────────────────────────────────────── */

export async function getAdminOrders() {
  const snap = await getDocs(
    query(collection(db, "orders"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map(formatFirebaseDoc);
}

export async function getAdminAnalytics() {
  const [productsSnap, ordersSnap] = await Promise.all([
    getDocs(collection(db, "products")),
    getDocs(collection(db, "orders")),
  ]);

  const orders = ordersSnap.docs.map((d) => d.data());
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const prices = productsSnap.docs.map((d) => Number(d.data().price || 0));

  return {
    totalProducts: productsSnap.size,
    totalOrders: ordersSnap.size,
    totalRevenue,
    averagePrice: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
    highestPrice: prices.length ? Math.max(...prices) : 0,
    totalItemsSold: orders.reduce((sum, o) => sum + (o.items?.reduce((is, i) => is + Number(i.quantity || 0), 0) || 0), 0),
  };
}