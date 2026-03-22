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
} from "firebase/firestore";
import { db, formatFirebaseDoc } from "./firebase";

/* ─────────────────────────────────────────────────────────────
    PRODUCTS
───────────────────────────────────────────────────────────── */

/**
 * ADMIN: Returns ALL products including in-transit ones.
 * Use only inside /admin pages.
 */
export async function getProducts() {
  const snap = await getDocs(
    query(collection(db, "products"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map(formatFirebaseDoc);
}

/**
 * STOREFRONT: Returns only products that are visible to customers.
 * Filters out in-transit and hidden (inStock: false) products.
 * Use this on every public-facing page.
 */
export async function getStorefrontProducts() {
  const snap = await getDocs(
    query(collection(db, "products"), orderBy("createdAt", "desc"))
  );
  return snap.docs
    .map(formatFirebaseDoc)
    .filter((p) => p.inStock === true && p.inTransit !== true);
}

/**
 * Get a single product by Firestore ID or slug.
 * Tries ID first, then falls back to slug query.
 */
export async function getProduct(identifier) {
  if (!identifier) throw new Error("No identifier provided");

  // Attempt 1: direct Firestore document ID
  try {
    const docRef = doc(db, "products", identifier);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return formatFirebaseDoc(docSnap);
  } catch {
    // fall through to slug lookup
  }

  // Attempt 2: slug field
  try {
    const q = query(collection(db, "products"), where("slug", "==", identifier));
    const snap = await getDocs(q);
    if (!snap.empty) return formatFirebaseDoc(snap.docs[0]);
  } catch (err) {
    console.error("Slug query failed:", err);
  }

  throw new Error("Product not found");
}

export async function createProduct(data) {
  const baseSlug = data.name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;

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
  await updateDoc(doc(db, "products", id), {
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
  await updateDoc(doc(db, "products", id), {
    inStock,
    updatedAt: serverTimestamp(),
  });
  await fetch("/api/revalidate", { method: "POST" }).catch(() => {});
  return true;
}