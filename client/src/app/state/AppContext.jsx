"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  clearStoredUserSession,
  getStoredUserSession,
  setStoredUserSession,
} from "@/lib/userAuth";

const AppContext = createContext(null);
const STORAGE_KEY = "chronolite-cart";
const THEME_KEY = "chronolite-theme";

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [theme, setTheme] = useState("light");

  // Sync theme from what the inline script already applied to <html>
  useEffect(() => {
    const applied = document.documentElement.dataset.theme;
    if (applied === "dark" || applied === "light") {
      setTheme(applied);
    }
  }, []);

  useEffect(() => {
    try {
      const savedSession = getStoredUserSession();
      if (savedSession?.user) {
        setUser(savedSession.user);
      }

      const savedCart = window.localStorage.getItem(STORAGE_KEY);
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch {}
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (user) {
      const existing = getStoredUserSession();
      setStoredUserSession({ ...(existing || {}), user });
      return;
    }

    const existing = getStoredUserSession();
    if (existing?.token) {
      setStoredUserSession({ token: existing.token, user: null });
    } else {
      clearStoredUserSession();
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

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
    if (nextQuantity <= 0) {
      removeFromCart(slug);
      return;
    }
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.slug === slug ? { ...item, quantity: nextQuantity } : item
      )
    );
  }

  function clearCart() {
    setCartItems([]);
  }

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  function signIn(session) {
    setUser(session.user);
    setStoredUserSession(session);
  }

  function signOut() {
    setUser(null);
    clearStoredUserSession();
  }

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * item.quantity,
    0
  );

  const value = useMemo(
    () => ({
      user,
      setUser,
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
      signIn,
      signOut,
    }),
    [user, cartItems, cartCount, cartTotal, theme]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);