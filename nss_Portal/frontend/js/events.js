/*
 * ============================================================
 * NSS EVENTS
 * ============================================================
 * Loads events directly from Django API.
 *
 * Public:
 *   GET  /api/nss/events/
 *
 * Authenticated:
 *   POST /api/nss/events/<id>/register/
 * ============================================================
 */


let allEvents = [];



/*
 * ============================================================
 * LOAD EVENTS
 * ============================================================
 */

async function loadEvents() {

  const upcomingContainer =
    document.querySelector("#upcoming");

  const pastContainer =
    document.querySelector("#past");


  if (!upcomingContainer || !pastContainer) {
    return;
  }


  try {

    /*
     * IMPORTANT:
     * Public event list uses normal fetch().
     *
     * We do NOT use nssApi() here because the
     * events list is public.
     */

    const response = await fetch(
      "http://127.0.0.1:8000/api/nss/events/"
    );


    if (!response.ok) {

      throw new Error(
        `Events API returned ${response.status}`
      );

    }


    const data =
      await response.json();


    console.log(
      "Events API response:",
      data
    );


    allEvents =
      Array.isArray(data)
        ? data
        : (data.results || []);


    renderEvents(allEvents);


  } catch (error) {

    console.error(
      "Unable to load events:",
      error
    );


    upcomingContainer.innerHTML = `
      <div
        class="empty"
        style="grid-column:1/-1"
      >
        Unable to load events from the server.
      </div>
    `;


    pastContainer.innerHTML = "";

  }

}



/*
 * ============================================================
 * RENDER EVENTS
 * ============================================================
 */

function renderEvents(events) {

  const upcomingContainer =
    document.querySelector("#upcoming");

  const pastContainer =
    document.querySelector("#past");


  if (!upcomingContainer || !pastContainer) {
    return;
  }


  if (!events.length) {

    upcomingContainer.innerHTML = `
      <div
        class="empty"
        style="grid-column:1/-1"
      >
        No upcoming events available.
      </div>
    `;


    pastContainer.innerHTML = `
      <div
        class="empty"
        style="grid-column:1/-1"
      >
        No past events available.
      </div>
    `;


    return;

  }


  /*
   * Separate events by date.
   */

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );


  const upcomingEvents = [];
  const pastEvents = [];


  events.forEach(event => {

    const eventDate =
      new Date(
        event.date + "T00:00:00"
      );


    if (eventDate >= today) {

      upcomingEvents.push(event);

    } else {

      pastEvents.push(event);

    }

  });



  /*
   * Upcoming events
   */

  if (upcomingEvents.length) {

    upcomingContainer.innerHTML =
      upcomingEvents
        .map(event =>
          createEventCard(
            event,
            true
          )
        )
        .join("");

  } else {

    upcomingContainer.innerHTML = `
      <div
        class="empty"
        style="grid-column:1/-1"
      >
        No upcoming events available.
      </div>
    `;

  }



  /*
   * Past events
   */

  if (pastEvents.length) {

    pastContainer.innerHTML =
      pastEvents
        .map(event =>
          createEventCard(
            event,
            false
          )
        )
        .join("");

  } else {

    pastContainer.innerHTML = `
      <div
        class="empty"
        style="grid-column:1/-1"
      >
        No past events available.
      </div>
    `;

  }



  /*
   * Attach registration handlers
   */

  document
    .querySelectorAll(
      ".event-register-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {
          registerForEvent(button);
        }
      );

    });

}



/*
 * ============================================================
 * EVENT CARD
 * ============================================================
 */

function createEventCard(
  event,
  isUpcoming
) {

  const image =
    event.image
      ? event.image
      : "images/events/event-1.svg";


  return `
    <article class="card">

      ${
        image
          ? `
            <img
              src="${image}"
              alt="${escapeHtml(
                event.title ||
                "NSS Event"
              )}"
              style="
                width:100%;
                height:190px;
                object-fit:cover;
                border-radius:12px;
                margin-bottom:16px;
              "
              onerror="this.style.display='none'"
            >
          `
          : ""
      }


      <div class="card-body">

        <h3>
          ${escapeHtml(
            event.title ||
            "NSS Event"
          )}
        </h3>


        ${
          event.date
            ? `
              <p class="meta">
                📅 ${formatDate(
                  event.date
                )}
              </p>
            `
            : ""
        }


        ${
          event.time
            ? `
              <p class="meta">
                🕙 ${escapeHtml(
                  event.time
                )}
              </p>
            `
            : ""
        }


        ${
          event.venue
            ? `
              <p class="meta">
                📍 ${escapeHtml(
                  event.venue
                )}
              </p>
            `
            : ""
        }


        ${
          event.organizer
            ? `
              <p class="meta">
                <strong>
                  Organizer:
                </strong>

                ${escapeHtml(
                  event.organizer
                )}
              </p>
            `
            : ""
        }


        ${
          event.description
            ? `
              <p>
                ${escapeHtml(
                  event.description
                )}
              </p>
            `
            : ""
        }


        ${
          event.status
            ? `
              <span class="badge">
                ${escapeHtml(
                  event.status
                )}
              </span>
            `
            : ""
        }


        ${
          isUpcoming
            ? `
              <div
                style="
                  margin-top:16px;
                "
              >

                <button
                  type="button"
                  class="btn btn-success event-register-btn"
                  data-event-id="${event.id}"
                >
                  Register for Event
                </button>

              </div>
            `
            : ""
        }


      </div>

    </article>
  `;

}



/*
 * ============================================================
 * REGISTER FOR EVENT
 * ============================================================
 */

async function registerForEvent(button) {

  const eventId =
    button.dataset.eventId;


  if (!eventId) {
    return;
  }


  /*
   * Disable immediately so the user cannot
   * double-click the button.
   */

  button.disabled = true;

  button.textContent =
    "Registering...";


  try {

    /*
     * IMPORTANT:
     *
     * Registration requires authentication,
     * therefore we DO use nssApi() here.
     */

    const result =
      await nssApi(
        `/nss/events/${eventId}/register/`,
        {
          method: "POST"
        }
      );


    console.log(
      "Event registration successful:",
      result
    );


    button.textContent =
      "Already Registered ✓";


    /*
     * Keep disabled.
     */

    button.disabled = true;


  } catch (error) {

    console.error(
      "Event registration failed:",
      error
    );


    /*
     * Try to get the backend error message.
     */

    const message =
      error?.data?.detail ||
      error?.message ||
      "Unable to register for this event.";


    const lowerMessage =
      String(message)
        .toLowerCase();



    /*
     * Backend says the volunteer is
     * already registered.
     */

    if (
      lowerMessage.includes("already") ||
      lowerMessage.includes("registered")
    ) {

      button.textContent =
        "Already Registered ✓";

      button.disabled = true;

      return;

    }



    /*
     * Authentication problem.
     */

    if (
      lowerMessage.includes("authentication") ||
      lowerMessage.includes("credentials") ||
      lowerMessage.includes("token") ||
      lowerMessage.includes("401")
    ) {

      alert(
        "Please login as a volunteer before registering for an event."
      );


      button.disabled = false;

      button.textContent =
        "Register for Event";


      return;

    }



    /*
     * Any other error.
     */

    alert(
      String(message)
    );


    button.disabled = false;

    button.textContent =
      "Register for Event";

  }

}



/*
 * ============================================================
 * DATE FORMAT
 * ============================================================
 */

function formatDate(dateString) {

  if (!dateString) {
    return "";
  }


  const date =
    new Date(
      dateString + "T00:00:00"
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return dateString;

  }


  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );

}



/*
 * ============================================================
 * HTML ESCAPE
 * ============================================================
 */

function escapeHtml(value) {

  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}



/*
 * ============================================================
 * SEARCH + STATUS FILTER
 * ============================================================
 */

function setupEventFilters() {

  const searchInput =
    document.querySelector(
      "#eventSearch"
    );


  const statusSelect =
    document.querySelector(
      "#eventStatus"
    );


  if (
    !searchInput ||
    !statusSelect
  ) {

    return;

  }


  /*
   * Filter currently loaded events.
   */

  function renderFilteredEvents() {

    const query =
      searchInput.value
        .trim()
        .toLowerCase();


    const status =
      statusSelect.value;


    const today =
      new Date();


    today.setHours(
      0,
      0,
      0,
      0
    );


    const filtered =
      allEvents.filter(event => {

        /*
         * Search
         */

        const matchesSearch =
          !query ||

          String(
            event.title || ""
          )
            .toLowerCase()
            .includes(query) ||

          String(
            event.description || ""
          )
            .toLowerCase()
            .includes(query) ||

          String(
            event.venue || ""
          )
            .toLowerCase()
            .includes(query) ||

          String(
            event.organizer || ""
          )
            .toLowerCase()
            .includes(query);



        /*
         * Date
         */

        const eventDate =
          new Date(
            event.date +
            "T00:00:00"
          );


        let matchesStatus =
          true;


        if (
          status === "Upcoming"
        ) {

          matchesStatus =
            eventDate >= today;

        }


        if (
          status === "Past"
        ) {

          matchesStatus =
            eventDate < today;

        }


        return (
          matchesSearch &&
          matchesStatus
        );

      });



    /*
     * Split filtered events.
     */

    const upcoming =
      filtered.filter(event => {

        const date =
          new Date(
            event.date +
            "T00:00:00"
          );


        return date >= today;

      });


    const past =
      filtered.filter(event => {

        const date =
          new Date(
            event.date +
            "T00:00:00"
          );


        return date < today;

      });



    const upcomingContainer =
      document.querySelector(
        "#upcoming"
      );


    const pastContainer =
      document.querySelector(
        "#past"
      );



    /*
     * Render upcoming
     */

    if (upcomingContainer) {

      upcomingContainer.innerHTML =
        upcoming.length

          ? upcoming
              .map(event =>
                createEventCard(
                  event,
                  true
                )
              )
              .join("")

          : `
              <div
                class="empty"
                style="grid-column:1/-1"
              >
                No matching upcoming events.
              </div>
            `;

    }



    /*
     * Render past
     */

    if (pastContainer) {

      pastContainer.innerHTML =
        past.length

          ? past
              .map(event =>
                createEventCard(
                  event,
                  false
                )
              )
              .join("")

          : `
              <div
                class="empty"
                style="grid-column:1/-1"
              >
                No matching past events.
              </div>
            `;

    }



    /*
     * Attach registration handlers
     */

    document
      .querySelectorAll(
        ".event-register-btn"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {
            registerForEvent(button);
          }
        );

      });

  }



  /*
   * Filter listeners
   */

  searchInput.addEventListener(
    "input",
    renderFilteredEvents
  );


  statusSelect.addEventListener(
    "change",
    renderFilteredEvents
  );


  /*
   * Load events.
   */

  loadEvents();

}



/*
 * ============================================================
 * START
 * ============================================================
 */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    if (
      document.querySelector(
        "#eventSearch"
      ) &&

      document.querySelector(
        "#eventStatus"
      )
    ) {

      setupEventFilters();

    } else {

      loadEvents();

    }

  }
);