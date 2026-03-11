const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:5000";

export const BASE_URL = `${API_ORIGIN}/api`;
export const ASSET_BASE_URL =
  process.env.NEXT_PUBLIC_ASSET_ORIGIN || API_ORIGIN;

export async function getProducts() {
  const res = await fetch(`${BASE_URL}/products`, {
    cache: "no-store"
  });
  if (!res.ok) {
    throw new Error("Unable to load products");
  }
  return res.json();
}

export async function getProduct(slug) {
  const res = await fetch(`${BASE_URL}/products/${slug}`, {
    cache: "no-store"
  });
  if (!res.ok) {
    throw new Error("Unable to load product");
  }
  return res.json();
}

export async function loginUser(data) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload?.message || "Login failed");
  }
  return payload;
}

export async function registerUser(data) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload?.message || "Registration failed");
  }
  return payload;
}

export async function getAdminAnalytics(token) {
  const res = await fetch(`${BASE_URL}/products/analytics/overview`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload?.message || "Unable to load analytics");
  }
  return payload;
}

export async function createOrder(data, token) {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload?.message || "Unable to create order");
  }
  return payload;
}

export async function getAdminOrders(token) {
  const res = await fetch(`${BASE_URL}/orders`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload?.message || "Unable to load orders");
  }
  return payload;
}
