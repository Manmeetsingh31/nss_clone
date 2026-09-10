// ============================================================
// VOLUNTEER DASHBOARD
// ============================================================

async function loadVolunteerDashboard() {

  const user = getCurrentUser();

  if (!user) {
    console.warn("No logged-in volunteer found.");
    return;
  }


  // ============================================================
  // SHOW VOLUNTEER NAME
  // ============================================================

  const nameElement =
    document.querySelector('[data-user="name"]');

  if (nameElement) {

    nameElement.textContent =
      user.name ||
      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      user.email ||
      "Volunteer";
  }


  // ============================================================
  // DASHBOARD ELEMENTS
  // ============================================================

  const nssUnitElement =
    document.querySelector('[data-user="unit"]');

  const serviceHoursElement =
    document.querySelector('[data-user="hours"]');

  const activitiesRegisteredElement =
    document.querySelector('[data-user="activities-registered"]');

  const activitiesCompletedElement =
    document.querySelector('[data-user="activities"]');

  const eventsRegisteredElement =
    document.querySelector('[data-user="events-registered"]');

  const eventsAttendedElement =
    document.querySelector('[data-user="events-attended"]');

  const eventsContainer =
    document.querySelector("#dashEvents");


  try {

    // ==========================================================
    // GET REAL VOLUNTEER DATA
    // ==========================================================

    console.log(
      "Fetching volunteer dashboard data..."
    );

    const volunteerData =
      await nssApi("/volunteers/me/");

    console.log(
      "Volunteer API response:",
      volunteerData
    );


    // ==========================================================
    // NSS UNIT
    // ==========================================================

    if (nssUnitElement) {

      nssUnitElement.textContent =
        volunteerData.nss_unit
          ? `${volunteerData.nss_unit} (Unit ${volunteerData.unit_number})`
          : "Not Assigned";
    }


    // ==========================================================
    // ACTIVITY STATISTICS
    // ==========================================================

    if (activitiesRegisteredElement) {

      activitiesRegisteredElement.textContent =
        volunteerData.activities_registered || 0;
    }


    if (activitiesCompletedElement) {

      activitiesCompletedElement.textContent =
        volunteerData.activities_completed || 0;
    }


    if (serviceHoursElement) {

      serviceHoursElement.textContent =
        volunteerData.service_hours || 0;
    }


    // ==========================================================
    // EVENT STATISTICS
    // ==========================================================

    if (eventsRegisteredElement) {

      eventsRegisteredElement.textContent =
        volunteerData.events_registered || 0;
    }


    if (eventsAttendedElement) {

      eventsAttendedElement.textContent =
        volunteerData.events_attended || 0;
    }


    // ==========================================================
    // REGISTERED EVENT IDS
    // ==========================================================

    const registeredEventIds =
      (volunteerData.registered_event_ids || [])
        .map(id => String(id));


    // ==========================================================
    // LOAD ALL EVENTS
    // ==========================================================

    if (!eventsContainer) {
      return;
    }


    console.log(
      "Fetching /nss/events/ ..."
    );

    const eventsResponse =
      await nssApi("/nss/events/");

    console.log(
      "Events API response:",
      eventsResponse
    );


    // ==========================================================
    // HANDLE API PAGINATION
    // ==========================================================

    const eventList =
      Array.isArray(eventsResponse)
        ? eventsResponse
        : (eventsResponse.results || []);


    // ==========================================================
    // FILTER UPCOMING EVENTS
    // ==========================================================

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );


    const upcomingEvents =
      eventList.filter(event => {

        if (!event.date) {
          return true;
        }

        const eventDate =
          new Date(
            `${event.date}T00:00:00`
          );

        return (
          eventDate >= today &&
          event.status !== "Cancelled"
        );
      });


    // ==========================================================
    // NO UPCOMING EVENTS
    // ==========================================================

    if (!upcomingEvents.length) {

      eventsContainer.innerHTML = `
        <p class="meta">
          No upcoming NSS events available.
        </p>
      `;

      return;
    }


    // ==========================================================
    // DISPLAY UPCOMING EVENTS
    // ==========================================================

    eventsContainer.innerHTML =
      upcomingEvents
        .map(event => {

          const isRegistered =
            registeredEventIds.includes(
              String(event.id)
            );


          return `
            <div
              class="notice-item event-item"
              style="
                padding-left:0;
                padding-right:0;
                margin-bottom:16px;
              "
            >

              <span
                style="font-size:1.3rem"
              >
                📅
              </span>


              <span
                style="flex:1"
              >

                <strong>
                  ${escapeHtml(
                    event.title || "NSS Event"
                  )}
                </strong>

                <br>


                <small>

                  ${escapeHtml(
                    event.date || ""
                  )}

                  ${
                    event.time
                      ? ` · ${escapeHtml(event.time)}`
                      : ""
                  }

                  ${
                    event.venue
                      ? ` · ${escapeHtml(event.venue)}`
                      : ""
                  }

                </small>


                ${
                  event.organizer
                    ? `
                      <br>
                      <small>
                        ${escapeHtml(
                          event.organizer
                        )}
                      </small>
                    `
                    : ""
                }


                ${
                  event.description
                    ? `
                      <br>
                      <small>
                        ${escapeHtml(
                          event.description
                        )}
                      </small>
                    `
                    : ""
                }

              </span>


              ${
                isRegistered
                  ? `
                    <button
                      class="btn"
                      disabled
                    >
                      Registered ✓
                    </button>
                  `
                  : `
                    <a
                      class="btn btn-success"
                      href="events.html"
                    >
                      View Event
                    </a>
                  `
              }

            </div>
          `;

        })
        .join("");
  }


  catch (error) {

    console.error(
      "Unable to load volunteer dashboard:",
      error
    );

    console.error(
      "Status:",
      error?.status
    );

    console.error(
      "API response:",
      error?.data
    );


    if (eventsContainer) {

      eventsContainer.innerHTML = `
        <p class="meta">
          Unable to load events from the server.
        </p>
      `;
    }
  }
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }


  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadVolunteerDashboard();

  }
);