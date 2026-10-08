/* ============================================================
   SAVEALIFE MISSION HOSPITAL
   Main JavaScript - simple vanilla JS
   ============================================================ */

/* ------------------------------------------------------------
   EASY CONFIGURATION
   Replace these values with the hospital's verified details.
   ------------------------------------------------------------ */
const CONFIG = {
  whatsappNumber: "2348136217095",
  myHomeClinicUrl: "https://example.com/myhomeclinic",
  emergencyNumber: "+2348136217095",
  backendUrl: "" // Keep empty when the frontend and backend are served from the same Node.js server.
};

/* ========================= MOBILE MENU ========================= */

const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");

function closeMobileMenu() {
  if (!menuToggle || !mobileMenu) return;
  menuToggle.classList.remove("active");
  mobileMenu.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}

menuToggle?.addEventListener("click", (event) => {
  event.stopPropagation();
  const isOpen = mobileMenu.classList.toggle("open");
  menuToggle.classList.toggle("active", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

mobileMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMobileMenu);
});

document.addEventListener("click", (event) => {
  if (!mobileMenu?.classList.contains("open")) return;
  if (!mobileMenu.contains(event.target) && !menuToggle.contains(event.target)) {
    closeMobileMenu();
  }
});

/* ========================= MODALS ========================= */

const appointmentModal = document.getElementById("appointment-modal");
const faqModal = document.getElementById("faq-modal");

function openModal(modal) {
  if (!modal) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  const firstInput = modal.querySelector("input, select, textarea, button");
  firstInput?.focus();
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");

  if (!document.querySelector(".modal.open")) {
    document.body.classList.remove("modal-open");
  }
}

document.querySelectorAll("[data-open-appointment]").forEach((button) => {
  button.addEventListener("click", () => {
    closeMobileMenu();
    openModal(appointmentModal);
  });
});

document.querySelectorAll("[data-open-faq]").forEach((button) => {
  button.addEventListener("click", () => {
    closeMobileMenu();
    openModal(faqModal);
  });
});

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => {
    closeModal(button.closest(".modal"));
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    document.querySelectorAll(".modal.open").forEach(closeModal);
  }
});

/* ========================= FAQ ACCORDION ========================= */

function setupFaqItems(scope = document) {
  scope.querySelectorAll(".faq-question").forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest(".faq-item");
      const answer = item.querySelector(".faq-answer");
      const isOpen = item.classList.contains("open");

      /* Close other questions in the same FAQ group. */
      item.parentElement.querySelectorAll(".faq-item.open").forEach((openItem) => {
        if (openItem !== item) {
          openItem.classList.remove("open");
          openItem.querySelector(".faq-question").setAttribute("aria-expanded", "false");
          openItem.querySelector(".faq-answer").style.maxHeight = null;
        }
      });

      item.classList.toggle("open", !isOpen);
      button.setAttribute("aria-expanded", String(!isOpen));
      answer.style.maxHeight = !isOpen ? `${answer.scrollHeight}px` : null;
    });
  });
}

setupFaqItems();

/* ========================= WHATSAPP ========================= */

function getWhatsAppUrl() {
  if (!CONFIG.whatsappNumber) return null;

  const message = encodeURIComponent(
    "Hello David's Hospital. I would like to speak to a doctor."
  );

  return `https://wa.me/${CONFIG.whatsappNumber}?text=${message}`;
}

document.querySelectorAll("[data-whatsapp]").forEach((link) => {
  link.addEventListener("click", (event) => {
    const url = getWhatsAppUrl();

    if (!url) {
      event.preventDefault();
      alert("Please add the hospital's verified WhatsApp number in script.js first.");
      return;
    }

    link.href = url;
    link.target = "_blank";
    link.rel = "noopener";
  });
});

/* ========================= MYHOMECLINIC LINK ========================= */

document.querySelectorAll("[data-app-link]").forEach((link) => {
  link.href = CONFIG.myHomeClinicUrl;
});

/* ========================= EMERGENCY CALL ========================= */

document.querySelectorAll("[data-emergency-call]").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (!CONFIG.emergencyNumber) {
      event.preventDefault();
      alert("Please add the hospital's verified emergency number in script.js first.");
      return;
    }

    link.href = `tel:${CONFIG.emergencyNumber}`;
  });
});

/* ========================= BACKEND FORM HELPERS ========================= */

function apiUrl(endpoint) {
  return `${CONFIG.backendUrl}${endpoint}`;
}

async function sendFormToBackend(endpoint, form) {
  const response = await fetch(apiUrl(endpoint), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = { success: false, message: "The server returned an unexpected response." };
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Unable to send your request.");
  }

  return data;
}

/* ========================= APPOINTMENT FORM ========================= */

const appointmentForm = document.getElementById("appointment-form");
const appointmentStatus = document.getElementById("appointment-status");

appointmentForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!appointmentForm.checkValidity()) {
    appointmentForm.reportValidity();
    return;
  }

  const submitButton = appointmentForm.querySelector('button[type="submit"]');
  const originalText = submitButton?.textContent || "Submit Appointment";

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";
  }

  appointmentStatus.textContent = "Sending your appointment request...";
  appointmentStatus.classList.add("show");

  try {
    const data = await sendFormToBackend("/api/appointment", appointmentForm);
    appointmentStatus.textContent = data.message;
    appointmentStatus.classList.add("show");
    appointmentForm.reset();
  } catch (error) {
    appointmentStatus.textContent = error.message;
    appointmentStatus.classList.add("show");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }
});

/* ========================= CONTACT FORM ========================= */

const contactForm = document.getElementById("contact-form");
const contactStatus = document.getElementById("contact-message-status");

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!contactForm.checkValidity()) {
    contactForm.reportValidity();
    return;
  }

  const submitButton = contactForm.querySelector('button[type="submit"]');
  const originalText = submitButton?.textContent || "Send Message";

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";
  }

  contactStatus.textContent = "Sending your message...";
  contactStatus.classList.add("show");

  try {
    const data = await sendFormToBackend("/api/contact", contactForm);
    contactStatus.textContent = data.message;
    contactStatus.classList.add("show");
    contactForm.reset();
  } catch (error) {
    contactStatus.textContent = error.message;
    contactStatus.classList.add("show");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }
});

/* ========================= DOCTOR PROFILE BUTTONS ========================= */

document.querySelectorAll("[data-profile]").forEach((button) => {
  button.addEventListener("click", () => {
    const doctor = button.dataset.profile;
    alert(`${doctor}\n\nProfile details can be connected to a dedicated doctor profile page later.`);
  });
});

/* ========================= SCROLL REVEAL ========================= */

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("visible"));
}

/* ========================= DATE SAFETY ========================= */

const preferredDate = document.getElementById("preferred-date");

if (preferredDate) {
  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];

  preferredDate.min = localToday;
}

/* ========================= SMOOTH NAVIGATION ========================= */

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");

    if (!targetId || targetId === "#") return;

    const target = document.querySelector(targetId);

    if (target) {
      event.preventDefault();
      closeMobileMenu();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});
