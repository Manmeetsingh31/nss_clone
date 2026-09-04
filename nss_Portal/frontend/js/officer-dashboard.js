/* ============================================================
   PROGRAMME OFFICER DASHBOARD
   ============================================================ */

(function () {
    "use strict";

    const API = window.NSS_API_BASE || "http://127.0.0.1:8000/api";

    const token = () => localStorage.getItem("nssAccessToken");

    async function api(path, options = {}) {
        const headers = new Headers(options.headers || {});

        if (options.body && !headers.has("Content-Type")) {
            headers.set("Content-Type", "application/json");
        }

        const access = token();

        if (access && !headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${access}`);
        }

        const response = await fetch(`${API}${path}`, {
            ...options,
            headers
        });

        let data = null;

        try {
            data = await response.json();
        } catch (_) {}

        if (!response.ok) {
            const error = new Error("API request failed");
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    }


    /* ============================================================
       HELPERS
       ============================================================ */

    function esc(value) {
        if (value === null || value === undefined) return "";

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function arr(data) {
        if (Array.isArray(data)) return data;

        if (data && Array.isArray(data.results)) {
            return data.results;
        }

        return [];
    }


    function formatDate(date) {
        if (!date) return "—";

        const d = new Date(date);

        if (Number.isNaN(d.getTime())) {
            return date;
        }

        return d.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }


    function formatTime(time) {
        if (!time) return "";

        const parts = String(time).split(":");

        if (parts.length < 2) return time;

        let hour = parseInt(parts[0], 10);
        const minute = parts[1];

        const suffix = hour >= 12 ? "PM" : "AM";

        hour = hour % 12;

        if (hour === 0) hour = 12;

        return `${hour}:${minute} ${suffix}`;
    }


    function getErrorMessage(error) {
        if (error?.data) {
            if (typeof error.data === "string") {
                return error.data;
            }

            if (error.data.detail) {
                return error.data.detail;
            }

            try {
                return Object.values(error.data)
                    .flat()
                    .join(" ");
            } catch (_) {}
        }

        return error?.message || "Something went wrong.";
    }


    /* ============================================================
       DASHBOARD HTML
       ============================================================ */

    function renderDashboard(info) {

        const root = document.getElementById("officerDashboard");

        if (!root) return;

        const unit = info.nss_unit || info.unit || info.assigned_unit || "Not assigned";

        const activities = Number(
            info.activities ??
            info.activities_count ??
            info.total_activities ??
            0
        );

        const events = Number(
            info.events ??
            info.events_count ??
            info.total_events ??
            0
        );

        const officerName =
            info.name ||
            info.full_name ||
            info.username ||
            "Programme Officer";

        root.innerHTML = `
            <div class="card" style="margin-bottom:20px;">
                <h2>Welcome, ${esc(officerName)}</h2>
                <p class="meta">
                    Programme Officer · NSS
                </p>
            </div>

            <div class="dashboard-grid" style="
                display:grid;
                grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
                gap:16px;
                margin-bottom:25px;
            ">

                <div class="card">
                    <h3>Assigned Unit</h3>
                    <p style="font-size:22px;font-weight:700;">
                        ${esc(unit)}
                    </p>
                </div>

                <div class="card">
                    <h3>Activities</h3>
                    <p style="font-size:30px;font-weight:700;">
                        ${activities}
                    </p>
                </div>

                <div class="card">
                    <h3>Events</h3>
                    <p style="font-size:30px;font-weight:700;">
                        ${events}
                    </p>
                </div>

            </div>


            <div class="card" style="margin-bottom:20px;">
                <h2>Manage NSS Programme</h2>

                <div style="
                    display:grid;
                    grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
                    gap:15px;
                    margin-top:15px;
                ">

                    <button
                        type="button"
                        class="btn btn-primary"
                        id="createActivityBtn"
                    >
                        + Create Activity
                    </button>

                    <button
                        type="button"
                        class="btn btn-secondary"
                        id="manageActivitiesBtn"
                    >
                        Manage Activities
                    </button>

                    <button
                        type="button"
                        class="btn btn-primary"
                        id="createEventBtn"
                    >
                        + Create Event
                    </button>

                    <button
                        type="button"
                        class="btn btn-secondary"
                        id="manageEventsBtn"
                    >
                        Manage Events
                    </button>

                </div>
            </div>


            <div id="activityCreateArea"></div>

            <div id="eventCreateArea"></div>

            <div id="activitiesArea"></div>

            <div id="eventsArea"></div>

            <div id="participantsArea"></div>
        `;


        document
            .getElementById("createActivityBtn")
            ?.addEventListener("click", showCreateActivity);

        document
            .getElementById("createEventBtn")
            ?.addEventListener("click", showCreateEvent);

        document
            .getElementById("manageActivitiesBtn")
            ?.addEventListener("click", loadActivities);

        document
            .getElementById("manageEventsBtn")
            ?.addEventListener("click", loadEvents);

        loadActivities();
        loadEvents();
    }


    /* ============================================================
       LOAD OFFICER INFORMATION
       ============================================================ */

    async function loadOfficerInfo() {

        const root = document.getElementById("officerDashboard");

        if (!root) return;

        try {

            /*
             * First try the officer activity endpoint.
             * This also confirms that the logged-in user has
             * Programme Officer access.
             */

            const activities = await api("/nss/officer/activities/");

            const activityList = arr(activities);

            const eventsResponse = await api("/nss/officer/events/");
            const eventList = arr(eventsResponse);

            const user = JSON.parse(
                localStorage.getItem("nssUser") || "{}"
            );

            let unit =
                user.nss_unit ||
                user.unit ||
                user.unit_number ||
                "Assigned NSS Unit";

            /*
             * Try volunteer/profile endpoint only if available.
             * Failure here should not break the dashboard.
             */

            try {
                const me = await api("/volunteers/me/");

                unit =
                    me.nss_unit ||
                    me.unit_number ||
                    unit;
            } catch (_) {}

            renderDashboard({
                name:
                    user.name ||
                    user.full_name ||
                    user.username ||
                    "Programme Officer",

                nss_unit: unit,

                activities: activityList.length,

                events: eventList.length
            });

        } catch (error) {

            console.error("Programme Officer dashboard error:", error);

            root.innerHTML = `
                <div class="card">
                    <h2>Unable to load dashboard</h2>

                    <p class="meta">
                        ${esc(getErrorMessage(error))}
                    </p>

                    <button
                        type="button"
                        class="btn btn-primary"
                        onclick="location.reload()"
                    >
                        Try Again
                    </button>
                </div>
            `;
        }
    }


    /* ============================================================
       CREATE ACTIVITY
       ============================================================ */

    function showCreateActivity() {

        const area = document.getElementById("activityCreateArea");

        if (!area) return;

        area.innerHTML = `
            <div class="card" style="margin-bottom:20px;">

                <h2>Create Activity</h2>

                <form id="activityForm">

                    <div class="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            name="title"
                            required
                            placeholder="Activity title"
                        >
                    </div>

                    <div class="form-group">
                        <label>Date</label>
                        <input
                            type="date"
                            name="date"
                            required
                        >
                    </div>

                    <div class="form-group">
                        <label>Time</label>
                        <input
                            type="time"
                            name="time"
                        >
                    </div>

                    <div class="form-group">
                        <label>Venue</label>
                        <input
                            type="text"
                            name="venue"
                            placeholder="Venue"
                        >
                    </div>

                    <div class="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            rows="4"
                            placeholder="Activity description"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        class="btn btn-primary"
                    >
                        Create Activity
                    </button>

                    <button
                        type="button"
                        class="btn btn-secondary"
                        id="cancelActivityBtn"
                    >
                        Cancel
                    </button>

                    <p
                        id="activityFormMessage"
                        class="meta"
                        style="margin-top:12px;"
                    ></p>

                </form>

            </div>
        `;

        document
            .getElementById("cancelActivityBtn")
            ?.addEventListener("click", () => {
                area.innerHTML = "";
            });

        document
            .getElementById("activityForm")
            ?.addEventListener("submit", createActivity);
    }


    async function createActivity(event) {

        event.preventDefault();

        const form = event.target;

        const message =
            document.getElementById("activityFormMessage");

        const data = {
            title: form.title.value.trim(),
            date: form.date.value,
            time: form.time.value || null,
            venue: form.venue.value.trim(),
            description: form.description.value.trim()
        };

        try {

            message.textContent = "Creating activity...";

            await api("/nss/officer/activities/", {
                method: "POST",
                body: JSON.stringify(data)
            });

            message.textContent =
                "Activity created successfully.";

            form.reset();

            await loadActivities();

            await loadOfficerInfo();

        } catch (error) {

            console.error(error);

            message.textContent =
                getErrorMessage(error);
        }
    }


    /* ============================================================
       LOAD ACTIVITIES
       ============================================================ */

    async function loadActivities() {

        const area =
            document.getElementById("activitiesArea");

        if (!area) return;

        area.innerHTML = `
            <div class="card">
                <h2>Your Activities</h2>
                <p class="meta">Loading activities...</p>
            </div>
        `;

        try {

            const response =
                await api("/nss/officer/activities/");

            const activities = arr(response);

            if (!activities.length) {

                area.innerHTML = `
                    <div class="card">
                        <h2>Your Activities</h2>
                        <p class="meta">
                            No activities created yet.
                        </p>
                    </div>
                `;

                return;
            }

            area.innerHTML = `
                <div class="card" style="margin-bottom:20px;">

                    <h2>Your Activities</h2>

                    <div style="
                        display:grid;
                        gap:15px;
                        margin-top:15px;
                    ">

                        ${activities.map(activity => `

                            <div
                                class="card"
                                style="border:1px solid #ddd;"
                            >

                                <h3>
                                    ${esc(activity.title)}
                                </h3>

                                <p class="meta">
                                    ${formatDate(activity.date)}
                                    ${activity.time
                                        ? ` · ${formatTime(activity.time)}`
                                        : ""}
                                </p>

                                ${
                                    activity.venue
                                        ? `<p>📍 ${esc(activity.venue)}</p>`
                                        : ""
                                }

                                ${
                                    activity.description
                                        ? `<p>${esc(activity.description)}</p>`
                                        : ""
                                }

                                <div style="
                                    display:flex;
                                    gap:10px;
                                    flex-wrap:wrap;
                                    margin-top:12px;
                                ">

                                    <button
                                        class="btn btn-primary"
                                        data-participants-activity="${esc(activity.id)}"
                                    >
                                        Participants
                                    </button>

                                    <button
                                        class="btn btn-secondary"
                                        data-attendance-activity="${esc(activity.id)}"
                                    >
                                        Attendance
                                    </button>

                                </div>

                            </div>

                        `).join("")}

                    </div>

                </div>
            `;

            area
                .querySelectorAll("[data-participants-activity]")
                .forEach(button => {

                    button.addEventListener("click", () => {

                        loadActivityParticipants(
                            button.dataset.participantsActivity
                        );

                    });

                });

            area
                .querySelectorAll("[data-attendance-activity]")
                .forEach(button => {

                    button.addEventListener("click", () => {

                        loadActivityParticipants(
                            button.dataset.attendanceActivity,
                            true
                        );

                    });

                });

        } catch (error) {

            console.error(error);

            area.innerHTML = `
                <div class="card">
                    <h2>Your Activities</h2>
                    <p class="meta">
                        ${esc(getErrorMessage(error))}
                    </p>
                </div>
            `;
        }
    }


    /* ============================================================
       ACTIVITY PARTICIPANTS
       ============================================================ */

    async function loadActivityParticipants(
        activityId,
        attendanceMode = false
    ) {

        const area =
            document.getElementById("participantsArea");

        if (!area) return;

        area.innerHTML = `
            <div class="card">
                <h2>Participants</h2>
                <p class="meta">Loading...</p>
            </div>
        `;

        try {

            const response = await api(
                `/nss/officer/activities/${activityId}/participants/`
            );

            const participants = arr(response);

            area.innerHTML = `
                <div class="card" style="margin-bottom:20px;">

                    <h2>
                        Activity Participants
                    </h2>

                    ${
                        participants.length
                            ? participants.map(p => `

                                <div
                                    style="
                                        padding:14px 0;
                                        border-bottom:1px solid #ddd;
                                    "
                                >

                                    <strong>
                                        ${esc(
                                            p.volunteer_name ||
                                            p.name ||
                                            p.volunteer?.name ||
                                            "Volunteer"
                                        )}
                                    </strong>

                                    <p class="meta">
                                        ${esc(
                                            p.volunteer_email ||
                                            p.email ||
                                            p.volunteer?.email ||
                                            ""
                                        )}
                                    </p>

                                    <label>
                                        <input
                                            type="checkbox"
                                            data-attended="${esc(p.id)}"
                                            ${
                                                p.attended
                                                    ? "checked"
                                                    : ""
                                            }
                                        >
                                        Attended
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value="${esc(
                                            p.hours_awarded ?? 0
                                        )}"
                                        data-hours="${esc(p.id)}"
                                        style="
                                            margin-left:10px;
                                            width:100px;
                                        "
                                    >

                                    <button
                                        class="btn btn-primary"
                                        data-save-attendance="${esc(p.id)}"
                                        style="margin-left:10px;"
                                    >
                                        Save
                                    </button>

                                </div>

                            `).join("")
                            : `
                                <p class="meta">
                                    No volunteers have registered
                                    for this activity yet.
                                </p>
                            `
                    }

                </div>
            `;

            area
                .querySelectorAll("[data-save-attendance]")
                .forEach(button => {

                    button.addEventListener("click", async () => {

                        const id = button.dataset.saveAttendance;

                        const attendedInput =
                            area.querySelector(
                                `[data-attended="${id}"]`
                            );

                        const hoursInput =
                            area.querySelector(
                                `[data-hours="${id}"]`
                            );

                        try {

                            button.disabled = true;
                            button.textContent = "Saving...";

                            await api(
                                `/nss/officer/activity-participations/${id}/attendance/`,
                                {
                                    method: "PATCH",
                                    body: JSON.stringify({
                                        attended:
                                            attendedInput.checked,

                                        hours_awarded:
                                            Number(
                                                hoursInput.value || 0
                                            )
                                    })
                                }
                            );

                            button.textContent = "Saved ✓";

                        } catch (error) {

                            console.error(error);

                            button.disabled = false;

                            button.textContent =
                                getErrorMessage(error);
                        }
                    });
                });

            area.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        } catch (error) {

            console.error(error);

            area.innerHTML = `
                <div class="card">
                    <h2>Participants</h2>
                    <p class="meta">
                        ${esc(getErrorMessage(error))}
                    </p>
                </div>
            `;
        }
    }


    /* ============================================================
       CREATE EVENT
       ============================================================ */

    function showCreateEvent() {

        const area =
            document.getElementById("eventCreateArea");

        if (!area) return;

        area.innerHTML = `
            <div class="card" style="margin-bottom:20px;">

                <h2>Create Event</h2>

                <form id="eventForm">

                    <div class="form-group">
                        <label>Title</label>

                        <input
                            type="text"
                            name="title"
                            required
                            placeholder="Event title"
                        >
                    </div>

                    <div class="form-group">
                        <label>Date</label>

                        <input
                            type="date"
                            name="date"
                            required
                        >
                    </div>

                    <div class="form-group">
                        <label>Time</label>

                        <input
                            type="time"
                            name="time"
                        >
                    </div>

                    <div class="form-group">
                        <label>Venue</label>

                        <input
                            type="text"
                            name="venue"
                            placeholder="Venue"
                        >
                    </div>

                    <div class="form-group">
                        <label>Organizer</label>

                        <input
                            type="text"
                            name="organizer"
                            value="NSS, Punjabi University"
                        >
                    </div>

                    <div class="form-group">
                        <label>Description</label>

                        <textarea
                            name="description"
                            rows="4"
                            placeholder="Event description"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        class="btn btn-primary"
                    >
                        Create Event
                    </button>

                    <button
                        type="button"
                        class="btn btn-secondary"
                        id="cancelEventBtn"
                    >
                        Cancel
                    </button>

                    <p
                        id="eventFormMessage"
                        class="meta"
                        style="margin-top:12px;"
                    ></p>

                </form>

            </div>
        `;

        document
            .getElementById("cancelEventBtn")
            ?.addEventListener("click", () => {
                area.innerHTML = "";
            });

        document
            .getElementById("eventForm")
            ?.addEventListener("submit", createEvent);
    }


    async function createEvent(event) {

        event.preventDefault();

        const form = event.target;

        const message =
            document.getElementById("eventFormMessage");

        const data = {
            title: form.title.value.trim(),
            date: form.date.value,
            time: form.time.value || null,
            venue: form.venue.value.trim(),
            organizer: form.organizer.value.trim(),
            description: form.description.value.trim()
        };

        try {

            message.textContent = "Creating event...";

            await api("/nss/officer/events/", {
                method: "POST",
                body: JSON.stringify(data)
            });

            message.textContent =
                "Event created successfully.";

            form.reset();

            form.organizer.value =
                "NSS, Punjabi University";

            await loadEvents();

            await loadOfficerInfo();

        } catch (error) {

            console.error(error);

            message.textContent =
                getErrorMessage(error);
        }
    }


    /* ============================================================
       LOAD EVENTS
       ============================================================ */

    async function loadEvents() {

        const area =
            document.getElementById("eventsArea");

        if (!area) return;

        area.innerHTML = `
            <div class="card">
                <h2>Your Events</h2>
                <p class="meta">Loading events...</p>
            </div>
        `;

        try {

            const response =
                await api("/nss/officer/events/");

            const events = arr(response);

            if (!events.length) {

                area.innerHTML = `
                    <div class="card">
                        <h2>Your Events</h2>

                        <p class="meta">
                            No events created yet.
                        </p>
                    </div>
                `;

                return;
            }

            area.innerHTML = `
                <div class="card" style="margin-bottom:20px;">

                    <h2>Your Events</h2>

                    <div style="
                        display:grid;
                        gap:15px;
                        margin-top:15px;
                    ">

                        ${events.map(event => `

                            <div
                                class="card"
                                style="border:1px solid #ddd;"
                            >

                                <h3>
                                    ${esc(event.title)}
                                </h3>

                                <p class="meta">
                                    ${formatDate(event.date)}
                                    ${
                                        event.time
                                            ? ` · ${formatTime(event.time)}`
                                            : ""
                                    }
                                </p>

                                ${
                                    event.venue
                                        ? `<p>📍 ${esc(event.venue)}</p>`
                                        : ""
                                }

                                ${
                                    event.organizer
                                        ? `<p>
                                            Organizer:
                                            ${esc(event.organizer)}
                                           </p>`
                                        : ""
                                }

                                ${
                                    event.description
                                        ? `<p>
                                            ${esc(event.description)}
                                           </p>`
                                        : ""
                                }

                                <button
                                    class="btn btn-primary"
                                    data-event-participants="${esc(event.id)}"
                                >
                                    Participants & Attendance
                                </button>

                            </div>

                        `).join("")}

                    </div>

                </div>
            `;

            area
                .querySelectorAll("[data-event-participants]")
                .forEach(button => {

                    button.addEventListener("click", () => {

                        loadEventParticipants(
                            button.dataset.eventParticipants
                        );

                    });

                });

        } catch (error) {

            console.error(error);

            area.innerHTML = `
                <div class="card">

                    <h2>Your Events</h2>

                    <p class="meta">
                        ${esc(getErrorMessage(error))}
                    </p>

                </div>
            `;
        }
    }


    /* ============================================================
       EVENT PARTICIPANTS
       ============================================================ */

    async function loadEventParticipants(eventId) {

        const area =
            document.getElementById("participantsArea");

        if (!area) return;

        area.innerHTML = `
            <div class="card">
                <h2>Event Participants</h2>
                <p class="meta">Loading...</p>
            </div>
        `;

        try {

            const response = await api(
                `/nss/officer/events/${eventId}/participants/`
            );

            const participants = arr(response);

            area.innerHTML = `
                <div class="card" style="margin-bottom:20px;">

                    <h2>Event Participants</h2>

                    ${
                        participants.length
                            ? participants.map(p => `

                                <div
                                    style="
                                        padding:14px 0;
                                        border-bottom:1px solid #ddd;
                                    "
                                >

                                    <strong>
                                        ${esc(
                                            p.volunteer_name ||
                                            p.name ||
                                            p.volunteer?.name ||
                                            "Volunteer"
                                        )}
                                    </strong>

                                    <p class="meta">
                                        ${esc(
                                            p.volunteer_email ||
                                            p.email ||
                                            p.volunteer?.email ||
                                            ""
                                        )}
                                    </p>

                                    <label>
                                        <input
                                            type="checkbox"
                                            data-event-attended="${esc(p.id)}"
                                            ${
                                                p.attended
                                                    ? "checked"
                                                    : ""
                                            }
                                        >
                                        Attended
                                    </label>

                                    <button
                                        class="btn btn-primary"
                                        data-save-event-attendance="${esc(p.id)}"
                                        style="margin-left:10px;"
                                    >
                                        Save
                                    </button>

                                </div>

                            `).join("")
                            : `
                                <p class="meta">
                                    No volunteers have registered
                                    for this event yet.
                                </p>
                            `
                    }

                </div>
            `;

            area
                .querySelectorAll(
                    "[data-save-event-attendance]"
                )
                .forEach(button => {

                    button.addEventListener("click", async () => {

                        const id =
                            button.dataset.saveEventAttendance;

                        const input =
                            area.querySelector(
                                `[data-event-attended="${id}"]`
                            );

                        try {

                            button.disabled = true;
                            button.textContent = "Saving...";

                            await api(
                                `/nss/officer/event-participations/${id}/attendance/`,
                                {
                                    method: "PATCH",
                                    body: JSON.stringify({
                                        attended:
                                            input.checked
                                    })
                                }
                            );

                            button.textContent = "Saved ✓";

                        } catch (error) {

                            console.error(error);

                            button.disabled = false;

                            button.textContent =
                                getErrorMessage(error);
                        }
                    });
                });

            area.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        } catch (error) {

            console.error(error);

            area.innerHTML = `
                <div class="card">

                    <h2>Event Participants</h2>

                    <p class="meta">
                        ${esc(getErrorMessage(error))}
                    </p>

                </div>
            `;
        }
    }


    /* ============================================================
       INITIALIZE
       ============================================================ */

    document.addEventListener("DOMContentLoaded", function () {

        const root =
            document.getElementById("officerDashboard");

        if (!root) return;

        loadOfficerInfo();

    });

})();