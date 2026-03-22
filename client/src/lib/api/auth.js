/* ─────────────────────────────────────────────────────────────
    AUTH & GENERAL FETCH
───────────────────────────────────────────────────────────── */

export async function apiFetch(endpoint, options = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:5000";

  const res = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const payload = await res.json();
  if (!res.ok) throw new Error(payload.message || "API request failed");
  return payload;
}

export async function loginUser(credentials) {
  return await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}