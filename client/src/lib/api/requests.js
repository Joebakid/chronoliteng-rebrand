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
  arrayUnion,
} from "firebase/firestore";
import { db, formatFirebaseDoc } from "./firebase";

/* ─────────────────────────────────────────────────────────────
    REQUESTS (Support Hub / Chat)
───────────────────────────────────────────────────────────── */

export async function createRequest(user, { type, message, imageUrl }) {
  const ref = await addDoc(collection(db, "requests"), {
    userId: user.id || user.email,
    userEmail: user.email,
    userName: user.name || "",
    type,
    status: "open",
    messages: [
      {
        from: "user",
        text: message,
        imageUrl: imageUrl || "",
        sentAt: new Date().toISOString(),
      },
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id };
}

export async function getUserRequests(user) {
  if (!user) return [];
  const userId = user.id || user.email;

  const snap = await getDocs(
    query(
      collection(db, "requests"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    )
  );
  return snap.docs.map(formatFirebaseDoc);
}

export async function getAdminRequests() {
  const snap = await getDocs(
    query(collection(db, "requests"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map(formatFirebaseDoc);
}

export async function sendMessage(requestId, { from, text, imageUrl, replyTo }) {
  const message = {
    from,
    text: text || "",
    sentAt: new Date().toISOString(),
  };
  if (imageUrl) message.imageUrl = imageUrl;
  if (replyTo) message.replyTo = replyTo;

  await updateDoc(doc(db, "requests", requestId), {
    messages: arrayUnion(message),
    updatedAt: serverTimestamp(),
    status: from === "admin" ? "answered" : "open",
  });
  return true;
}

export async function deleteMessage(requestId, messageToDelete) {
  const ref = doc(db, "requests", requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Request not found");

  const filteredMessages = (snap.data().messages || []).filter(
    (m) =>
      !(m.sentAt === messageToDelete.sentAt && m.text === messageToDelete.text)
  );

  await updateDoc(ref, {
    messages: filteredMessages,
    updatedAt: serverTimestamp(),
  });
  return true;
}

export async function deleteRequest(requestId) {
  await deleteDoc(doc(db, "requests", requestId));
  return true;
}