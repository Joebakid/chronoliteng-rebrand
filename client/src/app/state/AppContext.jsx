"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const AppContext = createContext(null);
const STORAGE_KEY = "chronolite-cart";
const THEME_KEY = "chronolite-theme";

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [theme, setTheme] = useState("light");
  const [authLoading, setAuthLoading] = useState(true);

  // Sync theme from inline script
  useEffect(() => {
    const applied = document.documentElement.dataset.theme;
    if (applied === "dark" || applied === "light") setTheme(applied);
  }, []);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.emailVerified) {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        const profile = snap.exists() ? snap.data() : {};
        setUser({
          id: firebaseUser.uid,
          name: profile.name || firebaseUser.displayName || "",
          email: firebaseUser.email,
          isAdmin: profile.isAdmin || false,
        });
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load cart
  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem(STORAGE_KEY);
      if (savedCart) setCartItems(JSON.parse(savedCart));
    } catch {}
  }, []);

  // Save cart
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  // Sync theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  async function signUp({ name, email, password }) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", credential.user.uid), {
      name,
      email,
      isAdmin: false,
      createdAt: new Date().toISOString(),
    });
    await sendEmailVerification(credential.user);
    await firebaseSignOut(auth);
    return { message: "Registration successful. Check your email to confirm before logging in." };
  }

  async function signIn({ email, password }) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    if (!credential.user.emailVerified) {
      await firebaseSignOut(auth);
      throw new Error("Verify your email address before logging in.");
    }
    return credential.user;
  }

  async function signOut() {
    await firebaseSignOut(auth);
    setUser(null);
  }

  function addToCart(product) {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.slug === product.slug);
      if (existingItem) {
        return currentItems.map((item) =>
          item.slug === product.slug
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentItems, { ...product, quantity: 1 }];
    });
  }

  function removeFromCart(slug) {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.slug !== slug)
    );
  }

  function updateCartQuantity(slug, nextQuantity) {
    if (nextQuantity <= 0) { removeFromCart(slug); return; }
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.slug === slug ? { ...item, quantity: nextQuantity } : item
      )
    );
  }

  function clearCart() { setCartItems([]); }
  function toggleTheme() { setTheme((t) => t === "dark" ? "light" : "dark"); }

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * item.quantity, 0
  );

  const value = useMemo(
    () => ({
      user,
      setUser,
      authLoading,
      cartItems,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      cartCount,
      cartTotal,
      theme,
      setTheme,
      toggleTheme,
      signUp,
      signIn,
      signOut,
    }),
    [user, authLoading, cartItems, cartCount, cartTotal, theme]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);