import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db, formatFirebaseDoc } from "./firebase";

/* ─────────────────────────────────────────────────────────────
    USERS
───────────────────────────────────────────────────────────── */

export async function getUsers() {
  const snap = await getDocs(
    query(collection(db, "users"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map(formatFirebaseDoc);
}