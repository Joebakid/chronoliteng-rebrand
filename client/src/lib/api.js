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
  const slug =
    data.slug ||
    data.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");

  const ref = await addDoc(collection(db, "products"), {
    ...data,
    slug,
    inStock: false,
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
      slug: item.slug,
      name: item.name,
      price: Number(item.price || 0),
      quantity: item.quantity,
      collection: item.collection || "",
      image: item.image || (Array.isArray(item.images) ? item.images[0] : "") || "",
      images: Array.isArray(item.images) ? item.images : [],
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
    REQUESTS / CHAT MESSAGES
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

  // Add optional fields only if they have data to avoid Firebase arrayUnion errors
  if (imageUrl) message.imageUrl = imageUrl;
  if (replyTo) message.replyTo = replyTo;

  await updateDoc(ref, {
    messages: arrayUnion(message),
    updatedAt: serverTimestamp(),
    status: from === "admin" ? "answered" : "open",
  });

  return true;
}

/**
 * Deletes a single message by filtering the messages array
 */
export async function deleteMessage(requestId, messageToDelete) {
  const ref = doc(db, "requests", requestId);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error("Request not found");

  const data = snap.data();
  // Filter by both sentAt and text to ensure we don't delete identical-looking messages
  const filteredMessages = (data.messages || []).filter(
    (m) => !(m.sentAt === messageToDelete.sentAt && m.text === messageToDelete.text)
  );

  await updateDoc(ref, {
    messages: filteredMessages,
    updatedAt: serverTimestamp(),
  });

  return true;
}

/**
 * Deletes the entire request document
 */
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