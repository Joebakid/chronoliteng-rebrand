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
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db, formatFirebaseDoc } from "./firebase";

// Main admin email - sees all products
const MAIN_ADMIN_EMAIL = "josephbawo@gmail.com";

/* ─────────────────────────────────────────────────────────────
   PRODUCTS
   ───────────────────────────────────────────────────────────── */

/**
 * ADMIN: Returns products based on admin role.
 * - Main admin (josephbawo@gmail.com) sees ALL products
 * - Other admins see only products they created
 * - Legacy products (no createdBy) belong to main admin
 */
export async function getProducts(adminId = null, adminEmail = null) {
  const snap = await getDocs(
    query(collection(db, "products"), orderBy("createdAt", "desc"))
  );

  const products = snap.docs.map(formatFirebaseDoc);

  // Main admin sees everything
  if (adminEmail === MAIN_ADMIN_EMAIL) {
    return products;
  }

  // Other admins see only their own products
  if (adminId) {
    return products.filter((p) => p.createdBy === adminId);
  }

  // No admin context - return all
  return products;
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

export async function createProduct(data, createdBy) {
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
    createdBy: createdBy || null,
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
