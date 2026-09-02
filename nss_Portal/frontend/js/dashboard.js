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

  const activitiesRegisteredElement =
    document.querySelector(
      '[data-user="activities-registered"]'
    );

  const activitiesCompletedElement =
    document.querySelector(
      '[data-user="activities"]'
    );

  const serviceHoursElement =
    document.querySelector(
      '[data-user="hours"]'
    );

  const eventsAttendedElement =
    document.querySelector(
      '[data-user="events"]'
    );

  const nssUnitElement =
    document.querySelector(
      '[data-user="unit"]'
    );

  const activitiesContainer =
    document.querySelector("#dashEvents");


  // ============================================================
  // DEBUG
  // ============================================================

  console.log(
    "Volunteer dashboard starting..."
  );

  console.log(
    "Logged-in user:",
    user
  );

  console.log(
    "Access token exists:",
    !!localStorage.getItem("nssAccessToken")
  );


  if (!activitiesContainer) {

    console.warn(
      "#dashEvents was not found on the page."
    );

  }


  try {

    // ============================================================
    // GET VOLUNTEER DATA
    // ============================================================

    console.log(
      "Fetching /volunteers/me/ ..."
    );

    const volunteerData =
      await nssApi("/volunteers/me/");


    console.log(
      "Volunteer API response:",
      volunteerData
    );


    // ============================================================
    // NSS UNIT
    // ============================================================

    if (nssUnitElement) {

      if (volunteerData.nss_unit) {

        nssUnitElement.textContent =
          `${volunteerData.nss_unit} (Unit ${volunteerData.unit_number})`;

      } else {

        nssUnitElement.textContent =
          "Not Assigned";

      }

    }


    // ============================================================
    // ACTIVITIES REGISTERED
    // ============================================================

    if (activitiesRegisteredElement) {

      activitiesRegisteredElement.textContent =
        volunteerData.activities_registered || 0;

    }


    // ============================================================
    // ACTIVITIES COMPLETED
    // ============================================================

    if (activitiesCompletedElement) {

      activitiesCompletedElement.textContent =
        volunteerData.activities_completed || 0;

    }


    // ============================================================
    // SERVICE HOURS
    // ============================================================

    if (serviceHoursElement) {

      serviceHoursElement.textContent =
        volunteerData.service_hours || 0;

    }


    // ============================================================
    // EVENTS ATTENDED
    // ============================================================

    if (eventsAttendedElement) {

      eventsAttendedElement.textContent =
        volunteerData.events_attended || 0;

    }


    // ============================================================
    // REGISTERED ACTIVITY IDS
    // ============================================================

    const registeredActivityIds =
      (
        volunteerData.registered_activity_ids || []
      ).map(id => String(id));


    // ============================================================
    // LOAD ALL NSS ACTIVITIES
    // ============================================================

    if (!activitiesContainer) {
      return;
    }


    console.log(
      "Fetching /nss/activities/ ..."
    );


    const activities =
      await nssApi("/nss/activities/");


    console.log(
      "Activities API response:",
      activities
    );


    // ============================================================
    // HANDLE API PAGINATION
    // ============================================================

    const activityList =
      Array.isArray(activities)
        ? activities
        : (activities.results || []);


    // ============================================================
    // NO ACTIVITIES
    // ============================================================

    if (!activityList.length) {

      activitiesContainer.innerHTML =
        `
          <p class="meta">
            No upcoming activities available.
          </p>
        `;

      return;

    }


    // ============================================================
    // FILTER UPCOMING ACTIVITIES
    // ============================================================

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );


    const upcomingActivities =
      activityList.filter(
        activity => {

          if (!activity.date) {
            return true;
          }

          const activityDate =
            new Date(
              activity.date + "T00:00:00"
            );

          return activityDate >= today;

        }
      );


    // ============================================================
    // NO UPCOMING ACTIVITIES
    // ============================================================

    if (!upcomingActivities.length) {

      activitiesContainer.innerHTML =
        `
          <p class="meta">
            No upcoming activities available.
          </p>
        `;

      return;

    }


    // ============================================================
    // DISPLAY ACTIVITIES
    // ============================================================

    activitiesContainer.innerHTML =
      upcomingActivities
        .map(activity => {

          const isRegistered =
            registeredActivityIds.includes(
              String(activity.id)
            );


          return `

            <div
              class="notice-item activity-item"
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
                    activity.title || "NSS Activity"
                  )}
                </strong>

                <br>


                <small>

                  ${escapeHtml(
                    activity.date || ""
                  )}

                  ${
                    activity.location
                      ? ` · ${escapeHtml(activity.location)}`
                      : ""
                  }

                  ${
                    activity.hours !== undefined
                      ? ` · ${activity.hours} hours`
                      : ""
                  }

                </small>


                ${
                  activity.description
                    ? `
                      <br>
                      <small>
                        ${escapeHtml(
                          activity.description
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
                      class="btn activity-register-btn"
                      disabled
                    >
                      Already Registered ✓
                    </button>
                  `

                  : `
                    <button
                      class="btn btn-success activity-register-btn"
                      data-activity-id="${activity.id}"
                    >
                      Register
                    </button>
                  `
              }

            </div>

          `;

        })
        .join("");


    // ============================================================
    // REGISTER BUTTON HANDLERS
    // ============================================================

    document
      .querySelectorAll(
        ".activity-register-btn:not([disabled])"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            registerForActivity(
              button
            );

          }
        );

      });

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


    if (activitiesContainer) {

      activitiesContainer.innerHTML =
        `
          <p class="meta">
            Unable to load activities from the server.
          </p>
        `;

    }

  }

}



// ============================================================
// REGISTER FOR ACTIVITY
// ============================================================

async function registerForActivity(
  button
) {

  const activityId =
    button.dataset.activityId;


  if (!activityId) {
    return;
  }


  button.disabled = true;

  button.textContent =
    "Registering...";


  try {

    const result =
      await nssApi(
        `/nss/activities/${activityId}/register/`,
        {
          method: "POST"
        }
      );


    console.log(
      "Activity registration successful:",
      result
    );


    button.textContent =
      "Already Registered ✓";


    await loadVolunteerDashboard();

  }


  catch (error) {

    console.error(
      "Activity registration failed:",
      error
    );


    const message =
      error?.data?.detail ||
      "Unable to register for this activity.";


    if (
      message
        .toLowerCase()
        .includes("already")
      ||
      message
        .toLowerCase()
        .includes("registered")
    ) {

      button.textContent =
        "Already Registered ✓";

      button.disabled = true;

      return;

    }


    alert(message);


    button.disabled = false;

    button.textContent =
      "Register";

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