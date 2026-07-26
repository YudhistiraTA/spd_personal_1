// Empty string means "same origin" — requests go to /api/v1/... on whatever
// host served the frontend, and nginx strips the /api prefix and proxies
// the rest to the backend.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Parses a JSON error response and throws an Error with its message
 * (falling back to a generic message), attaching any validation `errors`.
 * @param {Response} res
 * @returns {Promise<never>}
 */
async function throwForResponse(res) {
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  const err = new Error(body?.message || "Request failed");
  if (body?.errors) err.errors = body.errors;
  throw err;
}

/**
 * @param {{ name: string, email: string, password: string }} data
 * @returns {Promise<{ _id: string, name: string, email: string }>}
 */
export async function register({ name, email, password }) {
  const res = await fetch(`${BASE_URL}/api/v1/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) return throwForResponse(res);
  return res.json();
}

/**
 * @param {{ email: string, password: string }} data
 * @returns {Promise<{ _id: string, name: string, email: string }>}
 */
export async function login({ email, password }) {
  const res = await fetch(`${BASE_URL}/api/v1/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return throwForResponse(res);
  return res.json();
}

/**
 * Logs out the current session. Never throws — logout is best-effort.
 * @returns {Promise<void>}
 */
export async function logout() {
  await fetch(`${BASE_URL}/api/v1/users/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => {});
}

/**
 * Fetches the currently authenticated user's profile, or null if not logged in.
 * @returns {Promise<{ _id: string, name: string, email: string } | null>}
 */
export async function getMe() {
  const res = await fetch(`${BASE_URL}/api/v1/users/me`, {
    credentials: "include",
  });
  if (res.status === 401) return null;
  if (!res.ok) return throwForResponse(res);
  return res.json();
}

/**
 * Rotates the refresh token (cookie) and obtains a new access token, or
 * returns null if the refresh token is missing/invalid/expired.
 * @returns {Promise<{ _id: string, name: string, email: string } | null>}
 */
export async function refresh() {
  const res = await fetch(`${BASE_URL}/api/v1/users/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (res.status === 401) return null;
  if (!res.ok) return throwForResponse(res);
  return res.json();
}
