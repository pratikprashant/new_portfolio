/*=============== HEADER SHADOW ON SCROLL ===============*/
const header = document.getElementById("header");

window.addEventListener("scroll", () => {
  header.classList.toggle("scroll-header", window.scrollY >= 50);
});

/*=============== LIGHT / DARK THEME ===============*/
const themeButton = document.getElementById("theme-button");
const lightTheme = "light-theme";
const iconTheme = "bx-sun";

const selectedTheme = localStorage.getItem("selected-theme");
const selectedIcon = localStorage.getItem("selected-icon");

const getCurrentTheme = () =>
  document.body.classList.contains(lightTheme) ? "dark" : "light";
const getCurrentIcon = () =>
  themeButton.classList.contains(iconTheme) ? "bx bx-moon" : "bx bx-sun";

if (selectedTheme) {
  document.body.classList[selectedTheme === "dark" ? "add" : "remove"](lightTheme);
  themeButton.classList[selectedIcon === "bx bx-moon" ? "add" : "remove"](iconTheme);
}

themeButton.addEventListener("click", () => {
  document.body.classList.toggle(lightTheme);
  themeButton.classList.toggle(iconTheme);
  localStorage.setItem("selected-theme", getCurrentTheme());
  localStorage.setItem("selected-icon", getCurrentIcon());
});

/*=============== HCR: CHARACTER RECOGNITION ===============*/
const hcrCanvas = document.getElementById("hcr-canvas");

if (hcrCanvas) {
  // "" = file:// , so local testing uses your own Flask server
  const IS_LOCAL = ["", "localhost", "127.0.0.1"].includes(location.hostname);
  const API_BASE = IS_LOCAL
    ? "http://127.0.0.1:5000"
    : "https://prashant-ml-api.onrender.com";
  const HCR_URL = `${API_BASE}/api/hcr_predict`;

  // Wake the free Render server while the visitor is still drawing
  if (!IS_LOCAL) fetch(API_BASE, { mode: "no-cors" }).catch(() => {});

  const ctx = hcrCanvas.getContext("2d");
  const clearBtn = document.getElementById("hcr-clear");
  const predictBtn = document.getElementById("hcr-predict");
  const charEl = document.getElementById("hcr-char");
  const confEl = document.getElementById("hcr-conf");
  const statusEl = document.getElementById("hcr-status");
  const barsEl = document.getElementById("hcr-bars");

  let drawing = false;
  let hasInk = false;

  /* ---------- Board ---------- */
  function resetBoard() {
    // Paint the background black. The model expects white strokes on black.
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, hcrCanvas.width, hcrCanvas.height);

    ctx.lineWidth = 20;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#fff";

    hasInk = false;
  }

  // The canvas is 320px internally but may be shown smaller on phones.
  // This converts screen coordinates to canvas coordinates.
  function getPos(event) {
    const rect = hcrCanvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (hcrCanvas.width / rect.width),
      y: (event.clientY - rect.top) * (hcrCanvas.height / rect.height),
    };
  }

  // Pointer events handle mouse, touch and stylus in one set of listeners.
  hcrCanvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    drawing = true;
    hasInk = true;
    hcrCanvas.setPointerCapture(event.pointerId);

    const { x, y } = getPos(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.01, y); // a single tap leaves a dot
    ctx.stroke();
  });

  hcrCanvas.addEventListener("pointermove", (event) => {
    if (!drawing) return;
    const { x, y } = getPos(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  });

  ["pointerup", "pointercancel"].forEach((type) =>
    hcrCanvas.addEventListener(type, () => {
      drawing = false;
    })
  );

  /* ---------- Result display ---------- */
  function setStatus(text, isError = false) {
    statusEl.textContent = text;
    statusEl.classList.toggle("is-error", isError);
  }

  function resetResult() {
    charEl.textContent = "?";
    confEl.textContent = "--";
    barsEl.replaceChildren();
    setStatus("Draw something and press Predict.");
  }

  function makeBar(guess) {
    const row = document.createElement("div");
    row.className = "hcr-bar";

    const ch = document.createElement("span");
    ch.className = "hcr-bar__char";
    ch.textContent = guess.character;

    const track = document.createElement("div");
    track.className = "hcr-bar__track";
    const fill = document.createElement("div");
    fill.className = "hcr-bar__fill";
    fill.dataset.width = `${guess.confidence}%`;
    track.appendChild(fill);

    const pct = document.createElement("span");
    pct.className = "hcr-bar__pct";
    pct.textContent = `${guess.confidence.toFixed(1)}%`;

    row.append(ch, track, pct);
    return row;
  }

  function showResult(data) {
    charEl.textContent = data.character;
    confEl.textContent = `${data.confidence.toFixed(1)}%`;

    setStatus(
      data.confidence < 60
        ? "Not very sure. Try drawing bigger and clearer."
        : "Prediction complete."
    );

    barsEl.replaceChildren(...(data.top3 || []).map(makeBar));

    // Set the width after the bars are on the page so the CSS transition animates
    setTimeout(() => {
      barsEl.querySelectorAll(".hcr-bar__fill").forEach((fill) => {
        fill.style.width = fill.dataset.width;
      });
    }, 30);
  }

  /* ---------- Buttons ---------- */
  clearBtn.addEventListener("click", () => {
    resetBoard();
    resetResult();
  });

  predictBtn.addEventListener("click", async () => {
    if (!hasInk) {
      setStatus("Draw a character first ✍️", true);
      return;
    }

    predictBtn.disabled = true;
    setStatus("🧠 Analyzing...");

    // Free Render servers sleep, so the first request can be slow
    const slowTimer = setTimeout(
      () => setStatus("Server is waking up (free hosting). First request can take ~30s..."),
      4000
    );

    try {
      const response = await fetch(HCR_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: hcrCanvas.toDataURL("image/png") }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.error) {
        throw new Error(data.error || `Server error (${response.status})`);
      }

      showResult(data);
    } catch (error) {
      console.error(error);
      const offline = error instanceof TypeError; // fetch could not reach the server
      setStatus(offline ? "Could not reach the model server." : error.message, true);
    } finally {
      clearTimeout(slowTimer);
      predictBtn.disabled = false;
    }
  });

  resetBoard();
}