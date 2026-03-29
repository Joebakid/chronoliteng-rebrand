import { db } from "./firebase"; 
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";

const promoRef = collection(db, "promoCodes");

export const createPromo = async (data) => {
  return await addDoc(promoRef, {
    ...data,
    code: data.code.toUpperCase().trim(),
    discount: Number(data.discount),
    minSpend: Number(data.minSpend) || 0, // Added for high spenders
    message: data.message || "", // The "DM" alert text
    isActive: true,
    createdAt: serverTimestamp(),
    expiryDate: new Date(data.expiryDate).getTime(),
  });
};

export const getPromos = async () => {
  const snapshot = await getDocs(promoRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const deletePromo = async (id) => {
  return await deleteDoc(doc(db, "promoCodes", id));
};