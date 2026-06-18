import { UserSession } from "./types";

const cartKey = "shirt_cart_id";
const adminKey = "shirt_admin_session";
const adminCookieKey = "shirt_admin_signed_in";

function setAdminCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${adminCookieKey}=1; path=/; max-age=604800; SameSite=Lax`;
}

function clearAdminCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${adminCookieKey}=; path=/; max-age=0; SameSite=Lax`;
}

export function getCartId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(cartKey);
}

export function setCartId(cartId: string) {
  window.localStorage.setItem(cartKey, cartId);
}

export function clearCartId() {
  window.localStorage.removeItem(cartKey);
}

export function getAdminSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(adminKey);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as UserSession;
    setAdminCookie();
    return session;
  } catch {
    window.localStorage.removeItem(adminKey);
    clearAdminCookie();
    return null;
  }
}

export function setAdminSession(session: UserSession) {
  window.localStorage.setItem(adminKey, JSON.stringify(session));
  setAdminCookie();
}

export function clearAdminSession() {
  window.localStorage.removeItem(adminKey);
  clearAdminCookie();
}
