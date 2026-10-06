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
      sectionId = current.getAttribute("id");

    if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
      document
        .querySelector(".nav__menu a[href*=" + sectionId + "]")
        .classList.add("active-link");
    } else {
      document
        .querySelector(".nav__menu a[href*=" + sectionId + "]")
        .classList.remove("active-link");
    }
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
  duration: 2500,
  delay: 400,
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

sr.reveal(`.services__title, services__button`, {
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

sr.reveal(`.footer, footer__container`, {
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

/*=============== PROJECT MODAL ===============*/
const projects = {
  "character-recognition": {
    tag: "AI / ML",
    title: "Character Recognition",
    description:
      "A computer vision model that reads handwritten characters from images and classifies them.",
    highlights: [
      "Image preprocessing and normalization",
      "Trained and evaluated a classification model",
      "Tested on unseen handwriting samples",
    ],
    stack: ["Python", "OpenCV", "NumPy", "Scikit-learn"],
    github: "https://github.com/pratikprashant",
    demo: null,
  },
  "rag-assistant": {
    tag: "Generative AI",
    title: "RAG-Based AI Assistant",
    description:
      "An assistant that answers questions from my own documents by retrieving relevant context before generating a reply. It powers DNOVA on this site.",
    highlights: [
      "Embeddings and semantic search",
      "Context-aware answers grounded in source data",
      "Served through a Flask REST API",
    ],
    stack: ["Python", "Flask", "Embeddings", "Vector DB", "LLM API"],
    github: "https://github.com/pratikprashant",
    demo: "chatbot", // opens the DNOVA chat
  },
  "earthquake-risk": {
    tag: "AI / ML",
    title: "Earthquake Risk Prediction",
    description:
      "A machine learning model that estimates earthquake risk from historical seismic data.",
    highlights: [
      "Data cleaning and feature engineering",
      "Compared multiple models",
      "Evaluated with appropriate metrics",
    ],
    stack: ["Python", "Pandas", "Scikit-learn", "Matplotlib"],
    github: "https://github.com/pratikprashant",
    demo: null,
  },
  "phishing-detection": {
    tag: "AI / ML",
    title: "Phishing URL Detection",
    description:
      "A classifier that analyzes a URL's structure and features to flag likely phishing links.",
    highlights: [
      "URL feature extraction",
      "Trained and evaluated a classification model",
      "Deployed as a Flask API, try it live below",
    ],
    stack: ["Python", "Scikit-learn", "Flask", "REST API"],
    github: "https://github.com/pratikprashant",
    demo: "phishing", // opens the phishing demo
  },
  "churn-prediction": {
    tag: "Other",
    title: "Customer Churn Prediction",
    description:
      "A model that predicts which customers are likely to leave, so a business can act early.",
    highlights: [
      "Exploratory data analysis",
      "Handled class imbalance",
      "Model evaluation and comparison",
    ],
    stack: ["Python", "Pandas", "Scikit-learn", "Jupyter"],
    github: "https://github.com/pratikprashant",
    demo: null,
  },
};

const projectModal = document.getElementById("project-modal");
const pmImg = document.getElementById("project-modal-img");
const pmTag = document.getElementById("project-modal-tag");
const pmTitle = document.getElementById("project-modal-title");
const pmDesc = document.getElementById("project-modal-desc");
const pmList = document.getElementById("project-modal-list");
const pmStack = document.getElementById("project-modal-stack");
const pmGithub = document.getElementById("project-modal-github");
const pmDemo = document.getElementById("project-modal-demo");

let currentDemo = null;

function openProjectModal(id, imgSrc) {
  const p = projects[id];
  if (!p) return;

  pmImg.src = imgSrc;
  pmImg.alt = p.title;
  pmTag.textContent = p.tag;
  pmTitle.textContent = p.title;
  pmDesc.textContent = p.description;

  pmList.replaceChildren(
    ...p.highlights.map((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      return li;
    })
  );

  pmStack.replaceChildren(
    ...p.stack.map((tech) => {
      const s = document.createElement("span");
      s.textContent = tech;
      return s;
    })
  );

  pmGithub.href = p.github || "#";
  pmGithub.classList.toggle("is-hidden", !p.github);

  currentDemo = p.demo;
  pmDemo.classList.toggle("is-hidden", !p.demo);

  projectModal.classList.add("is-open");
  projectModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeProjectModal() {
  projectModal.classList.remove("is-open");
  projectModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

// Open from any "View Project" button
document.querySelectorAll(".work__button[data-project]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const card = btn.closest(".work__card");
    openProjectModal(btn.dataset.project, card.querySelector("img").src);
  });
});

// Live demo button: hand off to the phishing demo or the chatbot
pmDemo.addEventListener("click", (e) => {
  e.preventDefault();
  closeProjectModal();
  if (currentDemo === "phishing") {
    document.getElementById("phishing-demo").classList.add("active");
  } else if (currentDemo === "chatbot") {
    setChatOpen(true);
  }
});

// Close: X button, backdrop click, Escape
document
  .getElementById("project-modal-close")
  .addEventListener("click", closeProjectModal);

projectModal.addEventListener("click", (e) => {
  if (e.target === projectModal) closeProjectModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeProjectModal();
});