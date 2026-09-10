(() => {
  const defaultImage = "images/nss-default.svg";
  window.NSS_DEFAULT_IMAGE = defaultImage;

  window.getNssImageUrl = image => {
    const value = String(image || "").trim();
    if (!value) return defaultImage;

    try {
      if (/^https?:\/\//i.test(value)) return new URL(value).href;
      if (value.startsWith("/")) {
        const apiOrigin = new URL(window.NSS_API_BASE).origin;
        return new URL(value, apiOrigin).href;
      }
      if (value.startsWith("images/")) {
        return new URL(value, window.location.href).href;
      }
      if (value.startsWith("media/")) {
        const apiOrigin = new URL(window.NSS_API_BASE).origin;
        return new URL(`/${value}`, apiOrigin).href;
      }
    } catch (_) {
      return defaultImage;
    }

    return defaultImage;
  };
})();
