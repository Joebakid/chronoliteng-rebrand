"use client";

const PURCHASE_HISTORY_KEY = "chronolite-purchase-history";

function readPurchaseHistoryStore() {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(PURCHASE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writePurchaseHistoryStore(store) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PURCHASE_HISTORY_KEY, JSON.stringify(store));
}

function getUserKey(user) {
  return user?.id || user?.email || "guest";
}

export function getPurchaseHistory(user) {
  const store = readPurchaseHistoryStore();
  return store[getUserKey(user)] || [];
}

export function recordPurchase(user, items, total) {
  const store = readPurchaseHistoryStore();
  const userKey = getUserKey(user);
  const nextPurchase = {
    id: `purchase-${Date.now()}`,
    createdAt: new Date().toISOString(),
    total,
    items: items.map((item) => ({
      slug: item.slug,
      name: item.name,
      price: Number(item.price || 0),
      quantity: item.quantity,
      image: item.image || "",
    })),
  };

  store[userKey] = [nextPurchase, ...(store[userKey] || [])];
  writePurchaseHistoryStore(store);

  return nextPurchase;
}
