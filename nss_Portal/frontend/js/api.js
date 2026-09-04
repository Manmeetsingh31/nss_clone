/* NSS Portal API client configuration. */
window.NSS_API_BASE = "https://nss-portal-api.onrender.com/api";

async function nssApi(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const access = localStorage.getItem("nssAccessToken");
  if (access && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${access}`);
  }

  const response = await fetch(`${window.NSS_API_BASE}${path}`, {
    ...options,
    headers
  });

  let data = null;
  try { data = await response.json(); } catch (_) {}

  if (!response.ok) {
    const error = new Error("API request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
