function validateForm(form){
  let ok = true;
  form.querySelectorAll("[required]").forEach(input => {
    const err = input.parentElement.querySelector(".error");
    if (!input.value.trim()) {
      ok = false;
      if (err) err.textContent = "This field is required.";
    } else if (err) err.textContent = "";

    if (input.type === "email" && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
      ok = false;
      if (err) err.textContent = "Enter a valid email.";
    }
  });
  return ok;
}

function showFormSuccess(form, message){
  const box = form.parentElement.querySelector(".success-box") || document.createElement("div");
  box.className = "success-box";
  box.textContent = message;
  form.parentElement.appendChild(box);
  form.reset();
}

function setFieldError(form, field, message){
  const input = form.querySelector(`[name="${field}"]`);
  if (!input) return;
  const err = input.parentElement.querySelector(".error");
  if (err) err.textContent = message;
}

function formatRegistrationErrors(data){
  if (!data) return "Registration failed. Please try again.";
  if (data.detail) return data.detail;
  return Object.entries(data).map(([field, value]) => {
    const message = Array.isArray(value) ? value.join(" ") : String(value);
    return field === "non_field_errors" ? message : `${field}: ${message}`;
  }).join("\n");
}

async function loadNssOptions(){
  async function loadNssOptions() {
  const collegeSelect = document.querySelector("#collegeSelect");
  const unitSelect = document.querySelector("#unitSelect");

  if (!collegeSelect || !unitSelect) return;

  // Unit starts disabled until a college is selected
  unitSelect.disabled = true;
  unitSelect.innerHTML = '<option value="">Select NSS Unit</option>';

  try {
    // Load colleges
    const colleges = await nssApi("/nss/colleges/");

    collegeSelect.innerHTML =
      '<option value="">Select College</option>';

    colleges.forEach(college => {
      const option = document.createElement("option");

      option.value = college.id;
      option.textContent =
        `${college.name} (${college.code})`;

      collegeSelect.appendChild(option);
    });

  } catch (error) {
    console.error("Failed to load colleges:", error);

    collegeSelect.innerHTML =
      '<option value="">Unable to load colleges</option>';

    return;
  }

  // College selection
  collegeSelect.addEventListener("change", async () => {

    const collegeId = collegeSelect.value;

    // Reset units
    unitSelect.innerHTML =
      '<option value="">Loading NSS units...</option>';

    unitSelect.disabled = true;

    if (!collegeId) {
      unitSelect.innerHTML =
        '<option value="">Select NSS Unit</option>';
      return;
    }

    try {

      console.log(
        "Loading NSS units for college:",
        collegeId
      );

      const units = await nssApi(
        `/nss/units/?college=${encodeURIComponent(collegeId)}`
      );

      console.log("NSS units received:", units);

      unitSelect.innerHTML =
        '<option value="">Select NSS Unit</option>';

      if (!units || units.length === 0) {

        unitSelect.innerHTML =
          '<option value="">No NSS units available</option>';

        return;
      }

      units.forEach(unit => {

        const option = document.createElement("option");

        option.value = unit.id;

        option.textContent =
          `${unit.name} (Unit ${unit.unit_number})`;

        unitSelect.appendChild(option);

      });

      // Enable only after units are successfully loaded
      unitSelect.disabled = false;

    } catch (error) {

      console.error(
        "Failed to load NSS units:",
        error
      );

      unitSelect.innerHTML =
        '<option value="">Unable to load NSS units</option>';

      unitSelect.disabled = true;
    }
  });
}
}

async function submitVolunteerRegistration(form){
  if (!validateForm(form)) return;

  const password = form.password.value;
  const confirmPassword = form.confirmPassword.value;
  const passwordError = form.querySelector('[name="confirmPassword"]').parentElement.querySelector(".error");
  if (password !== confirmPassword) {
    if (passwordError) passwordError.textContent = "Passwords do not match.";
    return;
  }
  if (password.length < 8) {
    const error = form.querySelector('[name="password"]').parentElement.querySelector(".error");
    if (error) error.textContent = "Password must be at least 8 characters.";
    return;
  }

  const payload = {
    first_name: form.firstName.value.trim(),
    last_name: form.lastName.value.trim(),
    college: Number(form.college.value),
    nss_unit: Number(form.nssUnit.value),
    contact: form.contact.value.trim(),
    email: form.email.value.trim(),
    password,
    enrollment_number: form.enrollment.value.trim(),
    department: form.department.value.trim(),
    semester: Number(form.semester.value),
    gender: form.gender.value || "NOT_SPECIFIED",
    emergency_contact: form.emergencyContact.value.trim(),
    address: form.address.value.trim(),
    interests: form.interests.value.trim()
  };

  const submitButton = form.querySelector('button[type="submit"]');
  const apiError = form.querySelector(".form-api-error");
  if (apiError) apiError.textContent = "";
  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  try {
    const data = await nssApi("/volunteers/register/", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    showFormSuccess(form, `${data.message} You can now log in as a Volunteer.`);
  } catch (error) {
    if (error.data) {
      const message = formatRegistrationErrors(error.data);
      if (apiError) apiError.textContent = message;
      else alert(message);
    } else {
      const message = "Unable to connect to the NSS server. Make sure Django is running.";
      if (apiError) apiError.textContent = message;
      else alert(message);
    }
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Volunteer Registration";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadNssOptions();
  const form = document.querySelector("#volunteerRegistrationForm");
  if (form) {
    form.addEventListener("submit", event => {
      event.preventDefault();
      submitVolunteerRegistration(form);
    });
  }
});
