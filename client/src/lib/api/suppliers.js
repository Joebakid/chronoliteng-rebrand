import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db, formatFirebaseDoc } from "./firebase";

/* ─────────────────────────────────────────────────────────────
   SUPPLIERS
   ───────────────────────────────────────────────────────────── */

export async function getSuppliers() {
  const snap = await getDocs(
    query(collection(db, "suppliers"), orderBy("name", "asc"))
  );
  
  return snap.docs.map(formatFirebaseDoc);
}

export async function createSupplier(name) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Supplier name cannot be empty");

  const ref = await addDoc(collection(db, "suppliers"), {
    name: trimmed,
    createdAt: serverTimestamp(),
  });
  
  return { id: ref.id, name: trimmed };
}