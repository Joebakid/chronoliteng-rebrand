import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db, formatFirebaseDoc } from "./firebase";

// Main admin email - sees all categories
const MAIN_ADMIN_EMAIL = "josephbawo@gmail.com";

/* ─────────────────────────────────────────────────────────────
   CATEGORIES
   ───────────────────────────────────────────────────────────── */

/**
 * Returns categories based on admin role.
 * - Main admin (josephbawo@gmail.com) sees ALL categories
 * - Other admins see only categories they created
 * - Legacy categories (no createdBy) belong to main admin
 */
export async function getCategories(adminId = null, adminEmail = null) {
  const snap = await getDocs(
    query(collection(db, "categories"), orderBy("createdAt", "asc"))
  );

  const categories = snap.docs.map(formatFirebaseDoc);

  // Main admin sees everything
  if (adminEmail === MAIN_ADMIN_EMAIL) {
    return categories;
  }

  // Other admins see only their own categories
  if (adminId) {
    return categories.filter((c) => c.createdBy === adminId);
  }

  // No admin context - return all
  return categories;
}

export async function createCategory(name, createdBy) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name cannot be empty");

  const ref = await addDoc(collection(db, "categories"), {
    name: trimmed,
    createdAt: serverTimestamp(),
    createdBy: createdBy || null,
  });
  return { id: ref.id };
}

export async function deleteCategory(id) {
  await deleteDoc(doc(db, "categories", id));
  return true;
}
