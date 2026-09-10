(() => {
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  document.addEventListener("DOMContentLoaded", async () => {
    const grid = document.querySelector("#activityGrid");
    const search = document.querySelector("#activitySearch");
    const sort = document.querySelector("#activitySort");
    let activities = [];

    const render = () => {
      const query = search.value.trim().toLowerCase();
      const visible = activities.filter(activity => [activity.title, activity.description, activity.location, activity.date].join(" ").toLowerCase().includes(query)).sort((left, right) => sort.value === "new" ? String(right.date).localeCompare(String(left.date)) : String(left.date).localeCompare(String(right.date)));
      grid.innerHTML = visible.length ? visible.map(activity => `<article class="card activity-card"><div class="card-body"><h3>${escapeHtml(activity.title)}</h3>${activity.date || activity.location ? `<p class="meta">${[activity.date, activity.location].filter(Boolean).map(escapeHtml).join(" &middot; ")}</p>` : ""}${activity.description ? `<p>${escapeHtml(activity.description)}</p>` : ""}</div></article>`).join("") : `<div class="empty" style="grid-column:1/-1">${activities.length ? "No NSS activities match your search." : "No NSS activities have been published yet."}</div>`;
    };

    try {
      const response = await nssApi("/nss/activities/");
      activities = Array.isArray(response) ? response : [];
      window.activities = activities;
      render();
    } catch (_) {
      grid.innerHTML = '<div class="empty" style="grid-column:1/-1">NSS activities could not be loaded. Please try again later.</div>';
    }
    search.addEventListener("input", render);
    sort.addEventListener("change", render);
  });
})();
