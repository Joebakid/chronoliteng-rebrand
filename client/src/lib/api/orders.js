import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db, formatFirebaseDoc } from "./firebase";

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
      image:
        item.image ||
        (Array.isArray(item.images) ? item.images[0] : "") ||
        "",
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