"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export const USER_SESSION_KEY = "chronolite-user-session";

/**
 * Get stored user session
 */
export function getStoredUserSession() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(USER_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Save user session
 */
export function setStoredUserSession(session) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
}

/**
 * Clear stored session
 */
export function clearStoredUserSession() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(USER_SESSION_KEY);
}

/**
 * Google Login
 */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();

  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  /**
   * Create / sync Firestore user
   */
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      id: user.uid,
      name: user.displayName || "",
      email: user.email || "",
      photo: user.photoURL || "",
      provider: "google",
      isAdmin: false,
      createdAt: serverTimestamp(),
    });
  }

  /**
   * Local session (used by your AppContext)
   */
  const session = {
    uid: user.uid,
    name: user.displayName,
    email: user.email,
    photo: user.photoURL,
    provider: "google",
  };

  setStoredUserSession(session);

  return session;
}