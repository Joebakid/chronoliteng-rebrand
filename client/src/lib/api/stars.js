import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/* ─────────────────────────────────────────────────────────────
   STARS (Watchlist)
   ───────────────────────────────────────────────────────────── */

/**
 * Get all starred products for a user
 */
export async function getStarredProducts(userId) {
  if (!userId) return [];

  const snap = await getDocs(
    query(
      collection(db, "stars"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    )
  );

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.() || d.data().createdAt,
  }));
}

/**
 * Check if a product is starred by a user
 */
export async function isProductStarred(userId, productId) {
  if (!userId || !productId) return false;

  const snap = await getDocs(
    query(
      collection(db, "stars"),
      where("userId", "==", userId),
      where("productId", "==", productId)
    )
  );

  return !snap.empty;
}

/**
 * Star a product
 */
export async function starProduct(userId, product) {
  if (!userId || !product?.id) {
    throw new Error("User ID and product ID are required");
  }

  // Check if already starred
  const existing = await getDocs(
    query(
      collection(db, "stars"),
      where("userId", "==", userId),
      where("productId", "==", product.id)
    )
  );

  if (!existing.empty) {
    return { id: existing.docs[0].id, alreadyStarred: true };
  }

  const ref = await addDoc(collection(db, "stars"), {
    userId,
    productId: product.id,
    productName: product.name,
    productSlug: product.slug,
    productImage: product.images?.[0] || null,
    productPrice: product.price,
    productCategory: product.category,
    productCollection: product.collection,
    createdAt: serverTimestamp(),
  });

  return { id: ref.id, alreadyStarred: false };
}

/**
 * Unstar a product
 */
export async function unstarProduct(userId, productId) {
  if (!userId || !productId) {
    throw new Error("User ID and product ID are required");
  }

  const snap = await getDocs(
    query(
      collection(db, "stars"),
      where("userId", "==", userId),
      where("productId", "==", productId)
    )
  );

  if (snap.empty) {
    return false;
  }

  await deleteDoc(doc(db, "stars", snap.docs[0].id));
  return true;
}

/**
 * Toggle star status - returns true if now starred, false if unstarred
 */
export async function toggleStar(userId, product) {
  if (!userId || !product?.id) {
    throw new Error("User ID and product ID are required");
  }

  const snap = await getDocs(
    query(
      collection(db, "stars"),
      where("userId", "==", userId),
      where("productId", "==", product.id)
    )
  );

  if (snap.empty) {
    // Star it
    const ref = await addDoc(collection(db, "stars"), {
      userId,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.images?.[0] || null,
      productPrice: product.price,
      productCategory: product.category,
      productCollection: product.collection,
      createdAt: serverTimestamp(),
    });
    return { starred: true, id: ref.id };
  } else {
    // Unstar it
    await deleteDoc(doc(db, "stars", snap.docs[0].id));
    return { starred: false };
  }
}
