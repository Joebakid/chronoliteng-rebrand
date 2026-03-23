import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const formatFirebaseDoc = (d) => {
  const data = d.data();
  return {
    ...data,
    id: d.id,
    createdAt: data.createdAt?.toDate
      ? data.createdAt.toDate().toISOString()
      : data.createdAt || null,
    updatedAt: data.updatedAt?.toDate
      ? data.updatedAt.toDate().toISOString()
      : data.updatedAt || null,
  };
};

/**
 * STOREFRONT: Returns only products visible to customers.
 * Filters out in-transit and hidden (inStock: false) products.
 */
export async function getProducts() {
  const snap = await getDocs(
    query(collection(db, "products"), orderBy("createdAt", "desc"))
  );
  return snap.docs
    .map(formatFirebaseDoc)
    .filter((p) => p.inStock === true && p.inTransit !== true);
}

/**
 * Returns all categories from Firestore for the storefront filter.
 */
export async function getStorefrontCategories() {
  const snap = await getDocs(
    query(collection(db, "categories"), orderBy("createdAt", "asc"))
  );
  return snap.docs.map((d) => d.data().name).filter(Boolean);
}