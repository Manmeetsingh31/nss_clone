(() => {
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  document.addEventListener("DOMContentLoaded", async () => {
    const grid = document.querySelector("#unitGrid");
    const search = document.querySelector("#unitSearch");
    const sort = document.querySelector("#unitSort");
    let units = [];

    const render = () => {
      const query = search.value.trim().toLowerCase();
      const visible = units.filter(unit => [unit.name, unit.unit_number, unit.college_name, unit.programme_officer_name].join(" ").toLowerCase().includes(query)).sort((left, right) => sort.value === "college" ? (left.college_name || "").localeCompare(right.college_name || "") : Number(left.unit_number) - Number(right.unit_number));
      grid.innerHTML = visible.length ? visible.map(unit => `<article class="card feature-card"><span class="badge">Unit ${escapeHtml(unit.unit_number)}</span><h3>${escapeHtml(unit.name)}</h3><p><strong>${escapeHtml(unit.college_name)}</strong>${unit.programme_officer_name ? `<br>Programme Officer: ${escapeHtml(unit.programme_officer_name)}` : ""}</p></article>`).join("") : `<div class="empty" style="grid-column:1/-1">${units.length ? "No NSS units match your search." : "No NSS units are currently available."}</div>`;
    };

    try {
      const response = await nssApi("/nss/units/");
      units = Array.isArray(response) ? response : [];
      window.units = units;
      render();
    } catch (_) {
      grid.innerHTML = '<div class="empty" style="grid-column:1/-1">NSS units could not be loaded. Please try again later.</div>';
    }
    search.addEventListener("input", render);
    sort.addEventListener("change", render);
  });
})();
