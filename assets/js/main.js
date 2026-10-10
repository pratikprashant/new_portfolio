/*=============== CHANGE BACKGROUND HEADER ===============*/
function scrollHeader() {
  const header = document.getElementById("header");
  // When the scroll is greater than 50 viewport height, add the scroll-header class to the header tag
  if (this.scrollY >= 50) header.classList.add("scroll-header");
  else header.classList.remove("scroll-header");
}
window.addEventListener("scroll", scrollHeader);

/*=============== SERVICES MODAL ===============*/
// Get the modal
const modalViews = document.querySelectorAll(".services__modal"),
  modalBtns = document.querySelectorAll(".services__button"),
  modalClose = document.querySelectorAll(".services__modal-close");

// When the user clicks on the button, open the modal
let modal = function (modalClick) {
  modalViews[modalClick].classList.add("active-modal");
};

modalBtns.forEach((mb, i) => {
  mb.addEventListener("click", () => {
    modal(i);
  });
});

modalClose.forEach((mc) => {
  mc.addEventListener("click", () => {
    modalViews.forEach((mv) => {
      mv.classList.remove("active-modal");
    });
  });
});

/*=============== MIXITUP FILTER PORTFOLIO ===============*/

let mixer = mixitup(".work__container", {
  selectors: {
    target: ".work__card",
  },
  animation: {
    duration: 300,
  },
});

/* Link active work */
const workLinks = document.querySelectorAll(".work__item");

function activeWork(workLink) {
  workLinks.forEach((wl) => {
    wl.classList.remove("active-work");
  });
  workLink.classList.add("active-work");
}

workLinks.forEach((wl) => {
  wl.addEventListener("click", () => {
    activeWork(wl);
  });
});

/*=============== SWIPER TESTIMONIAL ===============*/

let swiperTestimonial = new Swiper(".testimonial__container", {
  spaceBetween: 24,
  loop: true,
  grabCursor: true,

  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },

  breakpoints: {
    576: {
      slidesPerView: 2,
    },
    768: {
      slidesPerView: 2,
      spaceBetween: 48,
    },
  },
});

/*=============== SCROLL SECTIONS ACTIVE LINK ===============*/

const sections = document.querySelectorAll("section[id]");

function scrollActive() {
  const scrollY = window.pageYOffset;

  sections.forEach((current) => {
    const sectionHeight = current.offsetHeight,
      sectionTop = current.offsetTop - 58,
      sectionId = current.getAttribute("id"),
      link = document.querySelector(".nav__menu a[href*=" + sectionId + "]");

    if (!link) return; // section has no nav icon

    link.classList.toggle(
      "active-link",
      scrollY > sectionTop && scrollY <= sectionTop + sectionHeight
    );
  });
}
window.addEventListener("scroll", scrollActive);

/*=============== LIGHT DARK THEME ===============*/
const themeButton = document.getElementById("theme-button");
const lightTheme = "light-theme";
const iconTheme = "bx-sun";

// Previously selected topic (if user selected)
const selectedTheme = localStorage.getItem("selected-theme");
const selectedIcon = localStorage.getItem("selected-icon");

// We obtain the current theme that the interface has by validating the light-theme class
const getCurrentTheme = () =>
  document.body.classList.contains(lightTheme) ? "dark" : "light";
const getCurrentIcon = () =>
  themeButton.classList.contains(iconTheme) ? "bx bx-moon" : "bx bx-sun";

// We validate if the user previously chose a topic
if (selectedTheme) {
  // If the validation is fulfilled, we ask what the issue was to know if we activated or deactivated the light
  document.body.classList[selectedTheme === "dark" ? "add" : "remove"](
    lightTheme
  );
  themeButton.classList[selectedIcon === "bx bx-moon" ? "add" : "remove"](
    iconTheme
  );
}

// Activate / deactivate the theme manually with the button
themeButton.addEventListener("click", () => {
  // Add or remove the light / icon theme
  document.body.classList.toggle(lightTheme);
  themeButton.classList.toggle(iconTheme);
  // We save the theme and the current icon that the user chose
  localStorage.setItem("selected-theme", getCurrentTheme());
  localStorage.setItem("selected-icon", getCurrentIcon());
});

/*=============== SCROLL REVEAL ANIMATION ===============*/
const sr = ScrollReveal({
  origin: "top",
  distance: "60px",
  duration: 1200,
  delay: 200,
  reset: true,
});

sr.reveal(`.nav__menu`, {
  delay: 100,
  scale: 0.1,
  origin: "bottom",
  distance: "300px",
});

sr.reveal(`.home__data`);
sr.reveal(`.home__handle`, {
  delay: 100,
});

sr.reveal(`.home__social, .home__scroll`, {
  delay: 100,
  origin: "bottom",
});

sr.reveal(`.about__img`, {
  delay: 100,
  origin: "left",
  scale: 0.9,
  distance: "30px",
});

sr.reveal(`.about__data, .about__description, .about__button-contact`, {
  delay: 100,
  scale: 0.9,
  origin: "right",
  distance: "30px",
});

sr.reveal(`.skills__content`, {
  delay: 100,
  scale: 0.9,
  origin: "bottom",
  distance: "30px",
});

sr.reveal(`.services__title, .services__button`, {
  delay: 100,
  scale: 0.9,
  origin: "top",
  distance: "30px",
});

sr.reveal(`.work__card`, {
  delay: 100,
  scale: 0.9,
  origin: "bottom",
  distance: "30px",
});

sr.reveal(`.testimonial__container`, {
  delay: 100,
  scale: 0.9,
  origin: "bottom",
  distance: "30px",
});

sr.reveal(`.contact__info, .contact__title-info`, {
  delay: 100,
  scale: 0.9,
  origin: "left",
  distance: "30px",
});

sr.reveal(`.contact__form, .contact__title-form`, {
  delay: 100,
  scale: 0.9,
  origin: "right",
  distance: "30px",
});

sr.reveal(`.footer, .footer__container`, {
  delay: 100,
  scale: 0.9,
  origin: "bottom",
  distance: "30px",
});


// Phishing URl Detection 
function openPhishingDemo(event) {
  event.preventDefault();
  document.getElementById("phishing-demo").classList.add("active");
}

function closePhishingDemo() {
  document.getElementById("phishing-demo").classList.remove("active");
}

async function checkPhishingURL() {
  const url = document.getElementById("phishing-url-input").value;
  const result = document.getElementById("phishing-result");

  if (!url) {
    result.textContent = "Please enter a URL.";
    return;
  }

  result.textContent = "Analyzing...";

  try {
    const response = await fetch("https://prashant-ml-api.onrender.com/api/phishing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: url
      })
    });

    const data = await response.json();

    result.textContent = data.result || data.error;

  } catch (error) {
    result.textContent = "Could not connect to the ML server.";
    console.error(error);
  }
}

// RAG Chatbot
const chatbot = document.getElementById("chatbot");
const toggle = document.getElementById("chatbot-toggle");
const closeBtn = document.getElementById("chatbot-close");
const input = document.getElementById("chatbot-input");
const sendButton = document.getElementById("chatbot-send");
const messages = document.getElementById("chatbot-messages");
const suggestions = document.getElementById("chatbot-suggestions");

let isSending = false;

function setChatOpen(open) {
  chatbot.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", open);
  if (open) setTimeout(() => input.focus(), 300);
}

toggle.addEventListener("click", () =>
  setChatOpen(!chatbot.classList.contains("is-open"))
);
closeBtn.addEventListener("click", () => setChatOpen(false));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setChatOpen(false);
});

function addMessage(text, className) {
  const el = document.createElement("div");
  el.className = className;
  el.textContent = text;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
  return el;
}

async function sendMessage(text) {
  const question = (text ?? input.value).trim();
  if (!question || isSending) return;

  isSending = true;
  sendButton.disabled = true;
  suggestions.classList.add("is-hidden");

  addMessage(question, "user-message");
  input.value = "";

  // Typing indicator
  const thinking = document.createElement("div");
  thinking.className = "bot-message bot-message--typing";
  thinking.innerHTML = "<span></span><span></span><span></span>";
  messages.appendChild(thinking);
  messages.scrollTop = messages.scrollHeight;

  try {
    const response = await fetch("https://prashant-ml-api.onrender.com/api/rag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const data = await response.json();

    thinking.classList.remove("bot-message--typing");
    thinking.textContent =
      data.answer || data.error || "Hmm, I couldn't find an answer to that.";
  } catch (error) {
    console.error(error);
    thinking.classList.remove("bot-message--typing");
    thinking.textContent = "Sorry, my brain is currently offline 🧠";
  } finally {
    isSending = false;
    sendButton.disabled = false;
    messages.scrollTop = messages.scrollHeight;
    input.focus();
  }
}

sendButton.addEventListener("click", () => sendMessage());

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") sendMessage();
});

suggestions.querySelectorAll("button").forEach((btn) => {
  btn.addEventListener("click", () => sendMessage(btn.dataset.q));
});

/*=============== EDUCATION TIMELINE ANIMATION ===============*/
(() => {
  const timeline = document.querySelector(".education__timeline");
  if (!timeline) return;

  const items = timeline.querySelectorAll(".education__item");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // No animation support or preference: show everything as-is
  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  // The hidden start state in the CSS only exists once this class is set,
  // so the section is never invisible if JS fails to load.
  document.documentElement.classList.add("education-js");

  // Reveal each item when it scrolls into view
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
  );
  items.forEach((item) => observer.observe(item));

  // Glowing line grows as you scroll through the section
  let ticking = false;

  const updateProgress = () => {
    const rect = timeline.getBoundingClientRect();
    const p = (window.innerHeight * 0.6 - rect.top) / rect.height;
    timeline.style.setProperty("--edu-p", Math.min(1, Math.max(0, p)).toFixed(3));
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateProgress);
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  updateProgress();
})();