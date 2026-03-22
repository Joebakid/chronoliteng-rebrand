import {
  collection,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db, formatFirebaseDoc } from "./firebase";

/* ─────────────────────────────────────────────────────────────
    PHYSICAL SALES (Walk-in)
───────────────────────────────────────────────────────────── */

export async function createPhysicalSale(saleData) {
  const ref = await addDoc(collection(db, "physicalSales"), {
    ...saleData,
    type: "physical",
    status: "completed",
    createdAt: serverTimestamp(),
  });
  return { id: ref.id };
}

export async function getPhysicalSales() {
  const snap = await getDocs(
    query(collection(db, "physicalSales"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map(formatFirebaseDoc);
}

export async function deletePhysicalSale(id) {
  await deleteDoc(doc(db, "physicalSales", id));
  return true;
}