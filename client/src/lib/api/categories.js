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

/* ─────────────────────────────────────────────────────────────
    CATEGORIES
───────────────────────────────────────────────────────────── */

export async function getCategories() {
  const snap = await getDocs(
    query(collection(db, "categories"), orderBy("createdAt", "asc"))
  );
  return snap.docs.map(formatFirebaseDoc);
}

export async function createCategory(name) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name cannot be empty");

  const ref = await addDoc(collection(db, "categories"), {
    name: trimmed,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id };
}

export async function deleteCategory(id) {
  await deleteDoc(doc(db, "categories", id));
  return true;
}