import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  where,
  arrayUnion,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

/**
 * Standardize Firebase documents to include string IDs and ISO dates
 */
const formatFirebaseDoc = (d) => {
  const data = d.data();
  return {
    ...data,
    id: d.id,
    createdAt: data.createdAt?.toDate
      ? data.createdAt.toDate().toISOString()
      : data.createdAt || null,
    updatedAt: data.updatedAt?.toDate
      ? data.updatedAt.toDate().toISOString()
      : data.updatedAt || null,
  };
};

/* ─────────────────────────────────────────────────────────────
    AUTH & GENERAL FETCH
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

/**
 * UPDATED: Aggressive lookup.
 * Try direct ID first (best for unique items like Tomi), then try Slug.
 */
export async function getProduct(identifier) {
  if (!identifier) throw new Error("No identifier provided");

  // 1. ATTEMPT 1: Try finding by direct Firebase Document ID
  try {
    const docRef = doc(db, "products", identifier);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return formatFirebaseDoc(docSnap);
    }
  } catch (err) {
    // Fail silently to try slug next
  }

  // 2. ATTEMPT 2: Try finding by slug
  try {
    const q = query(collection(db, "products"), where("slug", "==", identifier));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      return formatFirebaseDoc(snap.docs[0]);
    }
  } catch (err) {
    console.error("Slug query failed:", err);
  }

  throw new Error("Product not found");
}

/**
 * FIXED: Generates cleaner, unique slugs using a timestamp suffix
 */
export async function createProduct(data) {
  const baseSlug = data.name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") 
    .replace(/[\s_-]+/g, "-") 
    .replace(/^-+|-+$/g, "");

  const uniqueSuffix = Date.now().toString(36).slice(-4);
  const slug = `${baseSlug}-${uniqueSuffix}`;

  const ref = await addDoc(collection(db, "products"), {
    ...data,
    slug,
    inStock: true,
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

export async function toggleProductStock(id, inStock) {
  const ref = doc(db, "products", id);
  await updateDoc(ref, {
    inStock,
    updatedAt: serverTimestamp(),
  });

  await fetch("/api/revalidate", { method: "POST" }).catch(() => {});
  return true;
}

/* ─────────────────────────────────────────────────────────────
    ORDERS
───────────────────────────────────────────────────────────── */

export async function createOrder(orderData, user) {
  const ref = await addDoc(collection(db, "orders"), {
    ...orderData,
    userId: user?.id || user?.email || "guest",
    userEmail: user?.email || "",
    userName: user?.name || "",
    items: orderData.items.map((item) => ({
      slug: item.slug || item.id,
      name: item.name,
      price: Number(item.price || 0),
      quantity: item.quantity,
      collection: item.collection || "",
      image: item.image || (Array.isArray(item.images) ? item.images[0] : "") || "",
    })),
    status: "pending",
    createdAt: serverTimestamp(),
  });

  return { id: ref.id };
}

export async function getUserOrders(user) {
  if (!user) return [];
  const userId = user.id || user.email || "guest";

  const snap = await getDocs(
    query(
      collection(db, "orders"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    )
  );

  return snap.docs.map(formatFirebaseDoc);
}

export async function getAdminOrders() {
  const snap = await getDocs(
    query(collection(db, "orders"), orderBy("createdAt", "desc"))
  );

  return snap.docs.map(formatFirebaseDoc);
}

/* ─────────────────────────────────────────────────────────────
    USERS
───────────────────────────────────────────────────────────── */

export async function getUsers() {
  const snap = await getDocs(
    query(collection(db, "users"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map(formatFirebaseDoc);
}

/* ─────────────────────────────────────────────────────────────
    REQUESTS (Support Hub / Chat)
───────────────────────────────────────────────────────────── */

export async function createRequest(user, { type, message, imageUrl }) {
  const ref = await addDoc(collection(db, "requests"), {
    userId: user.id || user.email,
    userEmail: user.email,
    userName: user.name || "",
    type,
    status: "open",
    messages: [
      {
        from: "user",
        text: message,
        imageUrl: imageUrl || "",
        sentAt: new Date().toISOString(),
      },
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: ref.id };
}

export async function getUserRequests(user) {
  if (!user) return [];
  const userId = user.id || user.email;

  const snap = await getDocs(
    query(
      collection(db, "requests"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    )
  );

  return snap.docs.map(formatFirebaseDoc);
}

export async function getAdminRequests() {
  const snap = await getDocs(
    query(collection(db, "requests"), orderBy("createdAt", "desc"))
  );

  return snap.docs.map(formatFirebaseDoc);
}

export async function sendMessage(requestId, { from, text, imageUrl, replyTo }) {
  const ref = doc(db, "requests", requestId);

  const message = {
    from,
    text: text || "",
    sentAt: new Date().toISOString(),
  };

  if (imageUrl) message.imageUrl = imageUrl;
  if (replyTo) message.replyTo = replyTo;

  await updateDoc(ref, {
    messages: arrayUnion(message),
    updatedAt: serverTimestamp(),
    status: from === "admin" ? "answered" : "open",
  });

  return true;
}

export async function deleteMessage(requestId, messageToDelete) {
  const ref = doc(db, "requests", requestId);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error("Request not found");

  const data = snap.data();
  const filteredMessages = (data.messages || []).filter(
    (m) => !(m.sentAt === messageToDelete.sentAt && m.text === messageToDelete.text)
  );

  await updateDoc(ref, {
    messages: filteredMessages,
    updatedAt: serverTimestamp(),
  });

  return true;
}

export async function deleteRequest(requestId) {
  await deleteDoc(doc(db, "requests", requestId));
  return true;
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

  const totalRevenue = orders.reduce(
    (sum, o) => sum + Number(o.total || 0),
    0
  );

  return {
    totalProducts: productsSnap.size,
    totalOrders: ordersSnap.size,
    totalRevenue,
    averagePrice: prices.length
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : 0,
    highestPrice: prices.length ? Math.max(...prices) : 0,
    totalItemsSold: orders.reduce(
      (sum, o) =>
        sum +
        (o.items?.reduce(
          (is, i) => is + Number(i.quantity || 0),
          0
        ) || 0),
      0
    ),
  };
}