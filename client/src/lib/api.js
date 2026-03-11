const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:5000";
const isBrowser = typeof window !== "undefined";

export const BASE_URL = isBrowser ? "/api" : `${API_ORIGIN}/api`;
export const ASSET_BASE_URL =
  process.env.NEXT_PUBLIC_ASSET_ORIGIN || API_ORIGIN;

async function parsePayload(res) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return null;
}

function getNetworkErrorMessage() {
  return `API is unreachable at ${API_ORIGIN}/api. Start the backend server or set NEXT_PUBLIC_API_ORIGIN to the correct backend URL.`;
}

export async function apiFetch(path, options = {}) {
  let res;

  try {
    res = await fetch(`${BASE_URL}${path}`, options);
  } catch {
    throw new Error(getNetworkErrorMessage());
  }

  const payload = await parsePayload(res);

  if (!res.ok) {
    const error = new Error(payload?.message || options.fallbackMessage || "Request failed");
    error.status = res.status;
    throw error;
  }

  return payload;
}

export async function getProducts() {
  return apiFetch("/products", {
    cache: "no-store",
    fallbackMessage: "Unable to load products",
  });
}

export async function getProduct(slug) {
  return apiFetch(`/products/${slug}`, {
    cache: "no-store",
    fallbackMessage: "Unable to load product",
  });
}

export async function loginUser(data) {
  return apiFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    fallbackMessage: "Login failed",
  });
}

export async function registerUser(data) {
  return apiFetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    fallbackMessage: "Registration failed",
  });
}

export async function getAdminAnalytics(token) {
  return apiFetch("/products/analytics/overview", {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    fallbackMessage: "Unable to load analytics",
  });
}

export async function createOrder(data, token) {
  return apiFetch("/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    fallbackMessage: "Unable to create order",
  });
}

export async function getAdminOrders(token) {
  return apiFetch("/orders", {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    fallbackMessage: "Unable to load orders",
  });
}
