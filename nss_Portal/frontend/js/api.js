/* NSS Portal API client configuration. */

window.NSS_API_BASE =
  "https://nss-portal-api.onrender.com/api";


/*
 * Public endpoints do not require authentication.
 *
 * IMPORTANT:
 * Keep protected endpoints OUT of this list.
 */
const PUBLIC_API_PATHS = [
  "/nss/colleges/",
  "/nss/units/",
  "/nss/activities/",
  "/nss/events/"
];


function isPublicApiPath(path) {
  return PUBLIC_API_PATHS.some(publicPath =>
    path === publicPath ||
    path.startsWith(publicPath + "?")
  );
}


async function nssApi(path, options = {}) {

  const headers = new Headers(
    options.headers || {}
  );

  if (
    options.body &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }


  /*
   * Public requests should NOT depend on
   * whether an old login token exists.
   */
  const publicRequest =
    isPublicApiPath(path);


  const access =
    localStorage.getItem("nssAccessToken");


  /*
   * Only attach JWT to protected requests.
   */
  if (
    access &&
    !publicRequest &&
    !headers.has("Authorization")
  ) {
    headers.set(
      "Authorization",
      `Bearer ${access}`
    );
  }


  const response = await fetch(
    `${window.NSS_API_BASE}${path}`,
    {
      ...options,
      headers
    }
  );


  let data = null;

  try {
    data = await response.json();
  } catch (_) {}


  /*
   * If a protected request gets 401,
   * remove the stale access token so the
   * browser does not keep using it.
   *
   * We do NOT automatically retry protected
   * requests without authentication.
   */
  if (
    response.status === 401 &&
    !publicRequest
  ) {
    localStorage.removeItem(
      "nssAccessToken"
    );

    localStorage.removeItem(
      "nssRefreshToken"
    );
  }


  if (!response.ok) {

    const error =
      new Error("API request failed");

    error.status =
      response.status;

    error.data =
      data;

    throw error;
  }


  return data;
}