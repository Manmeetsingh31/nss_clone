function isLoggedIn() {
  return !!localStorage.getItem("nssAccessToken");
}

function getUserRole() {
  return localStorage.getItem("nssRole") || "";
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("nssUser") || "null");
  } catch (_) {
    return null;
  }
}

function saveAuthSession(data) {
  localStorage.setItem("nssAccessToken", data.access);
  localStorage.setItem("nssRefreshToken", data.refresh);
  localStorage.setItem("nssRole", data.user.role);
  localStorage.setItem("nssUser", JSON.stringify(data.user));
}

function clearAuthSession() {
  [
    "nssAccessToken",
    "nssRefreshToken",
    "nssRole",
    "nssUser"
  ].forEach(k => localStorage.removeItem(k));
}

function roleLabel(role) {
  return role === "PROGRAMME_OFFICER"
    ? "Programme Officer"
    : "Volunteer";
}

function formatApiErrors(data) {
  if (!data) {
    return "Something went wrong. Please try again.";
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  return Object.entries(data)
    .map(([field, value]) => {
      const message = Array.isArray(value)
        ? value.join(" ")
        : String(value);

      const label =
        field === "non_field_errors"
          ? ""
          : `${field}: `;

      return `${label}${message}`;
    })
    .join("\n");
}


async function loginWithRole(form, expectedRole) {
  const email = form.email.value.trim();
  const password = form.password.value;

  const errorBox = form.querySelector(".form-api-error");
  const button = form.querySelector('button[type="submit"]');

  if (errorBox) {
    errorBox.textContent = "";
  }

  button.disabled = true;
  button.textContent = "Signing in...";

  try {
    const data = await nssApi("/auth/login/", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        role: expectedRole
      })
    });

    if (data.user.role !== expectedRole) {
      throw new Error(
        "This account does not belong to the selected login type."
      );
    }

    saveAuthSession(data);

    location.href =
      expectedRole === "PROGRAMME_OFFICER"
        ? "officer-dashboard.html"
        : "dashboard.html";

  } catch (error) {

    if (error.data) {
      if (errorBox) {
        errorBox.textContent = formatApiErrors(error.data);
      }

    } else if (error.message) {
      if (errorBox) {
        errorBox.textContent = error.message;
      }

    } else if (errorBox) {
      errorBox.textContent =
        "Unable to connect to the NSS server. Make sure Django is running.";
    }

  } finally {

    button.disabled = false;

    button.textContent =
      expectedRole === "PROGRAMME_OFFICER"
        ? "Login as Programme Officer"
        : "Login as Volunteer";
  }
}


document.addEventListener("DOMContentLoaded", () => {

  /*
   * ============================================================
   * PROTECTED PAGE CHECK
   * ============================================================
   */

  const protectedPage =
    document.body.dataset.protected === "true";

  if (protectedPage && !isLoggedIn()) {
    location.href = "login.html";
    return;
  }


  /*
   * ============================================================
   * LOGOUT
   * ============================================================
   */

  document.querySelectorAll("[data-logout]").forEach(button => {

    button.addEventListener("click", event => {

      event.preventDefault();

      clearAuthSession();

      location.href = "login.html";
    });

  });


  /*
   * ============================================================
   * DISPLAY CURRENT USER
   * ============================================================
   */

  const user = getCurrentUser();

  if (user) {

    document.querySelectorAll("[data-user]").forEach(el => {

      const key = el.dataset.user;

      if (key === "role") {
        el.textContent = roleLabel(user.role);

      } else if (user[key] !== undefined) {
        el.textContent = user[key];
      }

    });

  }


  /*
   * ============================================================
   * LOGIN TYPE SELECTION
   * ============================================================
   */

  const volunteerChoice =
    document.querySelector("#volunteerLoginChoice");

  const officerChoice =
    document.querySelector("#officerLoginChoice");

  const volunteerPanel =
    document.querySelector("#volunteerLoginPanel");

  const officerPanel =
    document.querySelector("#officerLoginPanel");


  /*
   * VOLUNTEER LOGIN
   */

  if (volunteerChoice && volunteerPanel) {

    volunteerChoice.addEventListener("click", event => {

      event.preventDefault();

      volunteerPanel.classList.remove("hidden");

      if (officerPanel) {
        officerPanel.classList.add("hidden");
      }

      volunteerPanel.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

    });

  }


  /*
   * PROGRAMME OFFICER LOGIN
   */

  if (officerChoice && officerPanel) {

    officerChoice.addEventListener("click", event => {

      event.preventDefault();

      officerPanel.classList.remove("hidden");

      if (volunteerPanel) {
        volunteerPanel.classList.add("hidden");
      }

      officerPanel.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

    });

  }


  /*
   * ============================================================
   * HANDLE DIRECT URL HASH
   *
   * Example:
   * login.html#volunteerLoginPanel
   * login.html#officerLoginPanel
   * ============================================================
   */

  const hash = window.location.hash;

  if (hash === "#volunteerLoginPanel" && volunteerPanel) {

    volunteerPanel.classList.remove("hidden");

    if (officerPanel) {
      officerPanel.classList.add("hidden");
    }

    setTimeout(() => {
      volunteerPanel.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }, 100);

  }


  if (hash === "#officerLoginPanel" && officerPanel) {

    officerPanel.classList.remove("hidden");

    if (volunteerPanel) {
      volunteerPanel.classList.add("hidden");
    }

    setTimeout(() => {
      officerPanel.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }, 100);

  }


  /*
   * ============================================================
   * VOLUNTEER LOGIN FORM
   * ============================================================
   */

  const volunteerForm =
    document.querySelector("#volunteerLoginForm");

  if (volunteerForm) {

    volunteerForm.addEventListener("submit", event => {

      event.preventDefault();

      loginWithRole(
        volunteerForm,
        "VOLUNTEER"
      );

    });

  }


  /*
   * ============================================================
   * PROGRAMME OFFICER LOGIN FORM
   * ============================================================
   */

  const officerForm =
    document.querySelector("#officerLoginForm");

  if (officerForm) {

    officerForm.addEventListener("submit", event => {

      event.preventDefault();

      loginWithRole(
        officerForm,
        "PROGRAMME_OFFICER"
      );

    });

  }

});