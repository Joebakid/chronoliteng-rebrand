import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function isAdminUser() {
  const user = auth.currentUser;

  if (!user) return false;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return false;

  return snap.data().isAdmin === true;
}