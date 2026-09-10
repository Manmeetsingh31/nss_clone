(() => {
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  document.addEventListener("DOMContentLoaded", async () => {
    const grid = document.querySelector("#adminGrid");
    try {
      const response = await nssApi("/nss/units/");
      const officers = (Array.isArray(response) ? response : []).filter(unit => unit.programme_officer_name);
      grid.innerHTML = officers.length ? officers.map(unit => {
        const name = unit.programme_officer_name;
        const initials = name.split(/\s+/).map(part => part[0]).slice(0, 2).join("");
        return `<article class="card profile-card"><div class="avatar">${escapeHtml(initials)}</div><h3>${escapeHtml(name)}</h3><p><strong>Programme Officer</strong><br>Unit ${escapeHtml(unit.unit_number)}: ${escapeHtml(unit.name)}</p><p class="meta">${escapeHtml(unit.college_name)}</p></article>`;
      }).join("") : '<div class="empty" style="grid-column:1/-1">No verified NSS administration information is currently available.</div>';
    } catch (_) {
      grid.innerHTML = '<div class="empty" style="grid-column:1/-1">NSS administration information could not be loaded. Please try again later.</div>';
    }
  });
})();
