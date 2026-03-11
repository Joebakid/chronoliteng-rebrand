export const USER_SESSION_KEY = "chronolite-user-session";

export function getStoredUserSession() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(USER_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUserSession(session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
}

export function clearStoredUserSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_SESSION_KEY);
}
