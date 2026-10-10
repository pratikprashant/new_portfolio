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

/*=============== EARTHQUAKE RISK DEMO ===============*/
(() => {
  // ---- CONFIG ----
  const API_URL = "http://127.0.0.1:5000/predict-earthquake"; // your Flask endpoint

  // Rough bounding box around Nepal: [[south, west], [north, east]]
  const NEPAL_BOUNDS = [[26.3, 80.0], [30.5, 88.25]];

  // OPTIONAL: a Nepal boundary file (GeoJSON). If it exists, the map draws the
  // outline, zooms to it and only accepts points inside the country.
  const NEPAL_GEOJSON = "../assets/data/nepal.geojson";

  const form = document.getElementById("eq-form");
  if (!form) return;

  const placeEl = document.getElementById("eq-place");
  const latEl = document.getElementById("eq-latitude");
  const lngEl = document.getElementById("eq-longitude");
  const searchBtn = document.getElementById("eq-search");
  const msgEl = document.getElementById("eq-msg");
  const predictBtn = document.getElementById("eq-predict");

  const iconEl = document.getElementById("eq-icon");
  const levelEl = document.getElementById("eq-level");
  const statusEl = document.getElementById("eq-status");
  const fillEl = document.getElementById("eq-meter-fill");
  const pctEl = document.getElementById("eq-meter-pct");
  const barsEl = document.getElementById("eq-bars");

  const LEVEL_CLASSES = ["eq-low", "eq-moderate", "eq-high"];
  const DEFAULT_MSG = "Type a place and search, or click the map.";

  /*=============== MAP ===============*/
  if (typeof L === "undefined") {
    msgEl.textContent = "Map library failed to load.";
    msgEl.classList.add("is-error");
    return;
  }

  const map = L.map("eq-map", {
    center: [28.4, 84.1],
    zoom: 7,
    zoomSnap: 0.25,
    maxBoundsViscosity: 1.0,
    attributionControl: true,
  });

  let allowedBounds = L.latLngBounds(NEPAL_BOUNDS);
  let polygons = null; // filled if the GeoJSON loads
  let marker = null;

  const applyBounds = (bounds) => {
    allowedBounds = bounds;
    map.setMaxBounds(bounds.pad(0.1));
    map.fitBounds(bounds);
    map.setMinZoom(map.getZoom() - 0.25);
  };
  applyBounds(allowedBounds);

  // Tiles follow the site's dark / light theme
  const TILES = {
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    light: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  };
  const ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

  let tileLayer = null;
  const applyTiles = () => {
    const mode = document.body.classList.contains("light-theme") ? "light" : "dark";
    if (tileLayer) map.removeLayer(tileLayer);
    tileLayer = L.tileLayer(TILES[mode], {
      attribution: ATTRIBUTION,
      subdomains: "abcd",
      maxZoom: 14,
    }).addTo(map);
  };
  applyTiles();
  new MutationObserver(applyTiles).observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });

  // Optional Nepal outline
  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  fetch(NEPAL_GEOJSON)
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((geo) => {
      const layer = L.geoJSON(geo, {
        style: {
          color: cssVar("--first-color") || "#a789d4",
          weight: 2,
          fillOpacity: 0.06,
        },
        interactive: false,
      }).addTo(map);

      polygons = [];
      layer.eachLayer((l) => {
        const g = l.feature && l.feature.geometry;
        if (!g) return;
        if (g.type === "Polygon") polygons.push(g.coordinates);
        if (g.type === "MultiPolygon") polygons.push(...g.coordinates);
      });
      applyBounds(layer.getBounds());
    })
    .catch(() => {
      /* no boundary file: bounding box is used instead */
    });

  const inRing = (x, y, ring) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };

  const inNepal = (lat, lng) => {
    if (!allowedBounds.contains([lat, lng])) return false;
    if (!polygons) return true;
    return polygons.some(
      (poly) => inRing(lng, lat, poly[0]) && !poly.slice(1).some((hole) => inRing(lng, lat, hole))
    );
  };

  /*=============== LOCATION HELPERS ===============*/
  const setMsg = (text, isError = false) => {
    msgEl.textContent = text;
    msgEl.classList.toggle("is-error", isError);
  };

  const setLocation = (lat, lng, name, fly = false) => {
    latEl.value = lat.toFixed(5);
    lngEl.value = lng.toFixed(5);
    if (name) placeEl.value = name;

    if (marker) marker.setLatLng([lat, lng]);
    else marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(name || `${lat.toFixed(3)}, ${lng.toFixed(3)}`);

    if (fly) map.flyTo([lat, lng], Math.max(map.getZoom(), 9), { duration: 0.8 });
  };

  const clearLocation = () => {
    latEl.value = "";
    lngEl.value = "";
    if (marker) {
      map.removeLayer(marker);
      marker = null;
    }
    map.fitBounds(allowedBounds);
    setMsg(DEFAULT_MSG);
  };

  const geocode = async (query) => {
    const url =
      "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=np&q=" +
      encodeURIComponent(query);
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("geocode failed");
    const data = await res.json();
    if (!data.length) return null;
    const hit = data[0];
    return {
      lat: parseFloat(hit.lat),
      lng: parseFloat(hit.lon),
      name: hit.name || hit.display_name.split(",")[0],
    };
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&lat=${lat}&lon=${lng}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) return "";
      const d = await res.json();
      const a = d.address || {};
      return d.name || a.city || a.town || a.village || a.county || a.state_district || "";
    } catch {
      return "";
    }
  };

  // Search by place name -> returns true if a location was set
  const searchPlace = async () => {
    const q = placeEl.value.trim();
    if (!q) {
      setMsg("Enter a place name first.", true);
      return false;
    }
    searchBtn.disabled = true;
    setMsg("Searching...");
    try {
      const hit = await geocode(q);
      if (!hit || !inNepal(hit.lat, hit.lng)) {
        setMsg(`Couldn't find "${q}" in Nepal.`, true);
        return false;
      }
      setLocation(hit.lat, hit.lng, hit.name, true);
      setMsg(`Found: ${hit.name}`);
      return true;
    } catch (err) {
      console.error(err);
      setMsg("Place search failed. Try clicking the map instead.", true);
      return false;
    } finally {
      searchBtn.disabled = false;
    }
  };

  searchBtn.addEventListener("click", searchPlace);
  placeEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchPlace();
    }
  });

  // Click on map to pick a location
  map.on("click", async (e) => {
    const { lat, lng } = e.latlng;
    if (!inNepal(lat, lng)) {
      setMsg("Please pick a location inside Nepal.", true);
      return;
    }
    setLocation(lat, lng, "");
    placeEl.value = "";
    setMsg("Looking up place name...");
    const name = await reverseGeocode(lat, lng);
    if (name) {
      placeEl.value = name;
      marker.bindPopup(name);
    }
    setMsg(name ? `Selected: ${name}` : "Location selected.");
  });

  /*=============== OUTPUT ===============*/
  /*
    Expected JSON response from the backend (adjust parseResponse() if yours differs):
    {
      "risk_level": "High",              // "Low" | "Moderate" | "High"
      "probability": 0.82,               // 0-1
      "probabilities": { "Low": 0.05, "Moderate": 0.13, "High": 0.82 }   // optional
    }
  */
  const levelClass = (level) => {
    const l = String(level).toLowerCase();
    if (l.includes("high")) return "eq-high";
    if (l.includes("mod") || l.includes("med")) return "eq-moderate";
    return "eq-low";
  };

  const setStatus = (msg, isError = false) => {
    statusEl.textContent = msg;
    statusEl.classList.toggle("is-error", isError);
  };

  const resetOutput = () => {
    levelEl.textContent = "--";
    pctEl.textContent = "--";
    fillEl.style.width = "0";
    barsEl.innerHTML = "";
    [iconEl, fillEl].forEach((el) => el.classList.remove(...LEVEL_CLASSES));
    setStatus("Pick a location and press Predict.");
  };

  const parseResponse = (data) => ({
    level: data.risk_level ?? data.prediction ?? "Unknown",
    probability: Number(data.probability ?? 0),
    probabilities: data.probabilities ?? null,
  });

  const render = ({ level, probability, probabilities }) => {
    const cls = levelClass(level);
    const pct = Math.round(probability * 1000) / 10;

    [iconEl, fillEl].forEach((el) => {
      el.classList.remove(...LEVEL_CLASSES);
      el.classList.add(cls);
    });

    levelEl.textContent = level;
    pctEl.textContent = `${pct}%`;
    fillEl.style.width = `${pct}%`;
    const where = placeEl.value.trim();
    setStatus(`${where ? where + ": " : ""}${String(level).toLowerCase()} risk.`);

    barsEl.innerHTML = "";
    if (probabilities) {
      Object.entries(probabilities)
        .sort((a, b) => b[1] - a[1])
        .forEach(([name, p]) => {
          const val = Math.round(p * 1000) / 10;
          const row = document.createElement("div");
          row.className = "hcr-bar";
          row.innerHTML = `
            <span class="hcr-bar__char" title="${name}">${name.charAt(0)}</span>
            <div class="hcr-bar__track"><div class="hcr-bar__fill"></div></div>
            <span class="hcr-bar__pct">${val}%</span>`;
          barsEl.appendChild(row);
          requestAnimationFrame(() => {
            row.querySelector(".hcr-bar__fill").style.width = `${val}%`;
          });
        });
    }
  };

  /*=============== SUBMIT ===============*/
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // If a place was typed but not searched yet, resolve it first
    if (!latEl.value && placeEl.value.trim()) {
      const ok = await searchPlace();
      if (!ok) return;
    }

    const latitude = parseFloat(latEl.value);
    const longitude = parseFloat(lngEl.value);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setStatus("Pick a location first: search a place or click the map.", true);
      return;
    }

    const payload = { place: placeEl.value.trim(), latitude, longitude };

    predictBtn.disabled = true;
    setStatus("Analyzing...");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      render(parseResponse(await res.json()));
    } catch (err) {
      console.error(err);
      setStatus("Could not reach the model. Is the server running?", true);
    } finally {
      predictBtn.disabled = false;
    }
  });

  form.addEventListener("reset", () => {
    clearLocation();
    resetOutput();
  });
})();

/*=============== RAG ASSISTANT DEMO ===============*/
(() => {
  // ---- CONFIG: change to your backend ----
  const API_URL = "http://127.0.0.1:5000/ask";

  /*
    Request:  POST { "question": "..." }
    Expected response (adjust parseResponse() if yours differs):
    {
      "answer": "....",
      "sources": [
        { "title": "doc.pdf (p.3)", "text": "retrieved chunk...", "score": 0.82 }
      ]
    }
  */

  const form = document.getElementById("rag-form");
  if (!form) return;

  const inputEl = document.getElementById("rag-input");
  const sendBtn = document.getElementById("rag-send");
  const messagesEl = document.getElementById("rag-messages");
  const suggestionsEl = document.getElementById("rag-suggestions");
  const clearBtn = document.getElementById("rag-clear");
  const statusEl = document.getElementById("rag-status");
  const sourcesEl = document.getElementById("rag-sources");
  const stepEls = document.querySelectorAll(".rag-step");

  const INTRO = messagesEl.innerHTML;
  const DEFAULT_STATUS = "Ask something to see the retrieved sources.";
  const STEPS = ["embed", "retrieve", "generate"];

  let busy = false;
  let stepTimer = null;

  /*=============== HELPERS ===============*/
  const scrollDown = () => {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  const addMessage = (text, type, isError = false) => {
    const div = document.createElement("div");
    div.className = type === "user" ? "user-message" : "bot-message";
    if (isError) div.classList.add("is-error");
    div.textContent = text; // textContent: never inject model output as HTML
    messagesEl.appendChild(div);
    scrollDown();
    return div;
  };

  const addTyping = () => {
    const div = document.createElement("div");
    div.className = "bot-message bot-message--typing";
    div.innerHTML = "<span></span><span></span><span></span>";
    messagesEl.appendChild(div);
    scrollDown();
    return div;
  };

  const setStatus = (text, isError = false) => {
    statusEl.textContent = text;
    statusEl.classList.toggle("is-error", isError);
  };

  /*=============== PIPELINE ANIMATION ===============*/
  // The steps light up in sequence while waiting, and all turn done on response.
  const setSteps = (activeIndex, allDone = false) => {
    stepEls.forEach((el) => {
      const i = STEPS.indexOf(el.dataset.step);
      el.classList.toggle("is-done", allDone || i < activeIndex);
      el.classList.toggle("is-active", !allDone && i === activeIndex);
    });
  };

  const startSteps = () => {
    let i = 0;
    setSteps(i);
    stepTimer = setInterval(() => {
      i = Math.min(i + 1, STEPS.length - 1);
      setSteps(i);
    }, 900);
  };

  const stopSteps = (success) => {
    clearInterval(stepTimer);
    if (success) setSteps(STEPS.length, true);
    else stepEls.forEach((el) => el.classList.remove("is-active", "is-done"));
  };

  /*=============== SOURCES ===============*/
  const renderSources = (sources) => {
    sourcesEl.innerHTML = "";
    if (!sources || !sources.length) {
      setStatus("No sources were returned for this answer.");
      return;
    }
    setStatus(`Retrieved ${sources.length} passage${sources.length > 1 ? "s" : ""}.`);

    sources.forEach((s) => {
      const card = document.createElement("div");
      card.className = "rag-source";

      const head = document.createElement("div");
      head.className = "rag-source__head";

      const title = document.createElement("span");
      title.className = "rag-source__title";
      title.textContent = s.title || "Source";
      head.appendChild(title);

      if (typeof s.score === "number") {
        const score = document.createElement("span");
        score.className = "rag-source__score";
        score.textContent = s.score.toFixed(2);
        head.appendChild(score);
      }

      const text = document.createElement("p");
      text.className = "rag-source__text";
      const raw = s.text || "";
      text.textContent = raw.length > 240 ? raw.slice(0, 240).trim() + "…" : raw;

      card.append(head, text);
      sourcesEl.appendChild(card);
    });
  };

  const parseResponse = (data) => ({
    answer: data.answer ?? data.response ?? "",
    sources: data.sources ?? [],
  });

  /*=============== ASK ===============*/
  const ask = async (question) => {
    if (busy) return;
    const q = question.trim();
    if (!q) return;

    busy = true;
    sendBtn.disabled = true;
    inputEl.value = "";
    suggestionsEl.classList.add("is-hidden");

    addMessage(q, "user");
    const typing = addTyping();
    sourcesEl.innerHTML = "";
    setStatus("Working on it...");
    startSteps();

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);

      const { answer, sources } = parseResponse(await res.json());
      typing.remove();
      addMessage(answer || "I couldn't find an answer to that.", "bot");
      stopSteps(true);
      renderSources(sources);
    } catch (err) {
      console.error(err);
      typing.remove();
      addMessage("I couldn't reach the assistant. Is the server running?", "bot", true);
      stopSteps(false);
      setStatus("Request failed.", true);
    } finally {
      busy = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  };

  /*=============== EVENTS ===============*/
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    ask(inputEl.value);
  });

  suggestionsEl.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => ask(btn.dataset.q));
  });

  clearBtn.addEventListener("click", () => {
    if (busy) return;
    messagesEl.innerHTML = INTRO;
    sourcesEl.innerHTML = "";
    suggestionsEl.classList.remove("is-hidden");
    stopSteps(false);
    setStatus(DEFAULT_STATUS);
  });
})();

/*=============== PHISHING URL DETECTION DEMO ===============*/
(() => {
  // ---- CONFIG: change to your backend ----
  const API_URL = "http://127.0.0.1:5000/check-url";

  /*
    Request:  POST { "url": "https://..." }
    Expected response (adjust parseResponse() if yours differs):
    {
      "verdict": "phishing",              // "phishing" | "legitimate"
      "phishing_probability": 0.93,       // 0-1  (preferred)
      "domain": {
        "resolves": true,                 // DNS lookup succeeded
        "ips": ["93.184.216.34"],         // optional
        "age_days": 412                   // optional, from RDAP/WHOIS (null if unknown)
      }
    }
    The backend should only do DNS / RDAP lookups. It must NOT fetch the page itself.
  */

  const form = document.getElementById("ph-form");
  if (!form) return;

  const urlEl = document.getElementById("ph-url");
  const analyzeBtn = document.getElementById("ph-analyze");
  const clearBtn = document.getElementById("ph-clear");
  const examplesEl = document.getElementById("ph-examples");

  const iconEl = document.getElementById("ph-icon");
  const verdictEl = document.getElementById("ph-verdict");
  const statusEl = document.getElementById("ph-status");
  const fillEl = document.getElementById("ph-meter-fill");
  const pctEl = document.getElementById("ph-meter-pct");
  const formatEl = document.getElementById("ph-format");
  const domainEl = document.getElementById("ph-domain");

  const STATE_CLASSES = ["ph-ok", "ph-warn", "ph-bad"];
  const ICONS = {
    ok: "bx-check-circle",
    warn: "bx-error",
    bad: "bx-x-circle",
  };

  const SHORTENERS = [
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd",
    "buff.ly", "rebrand.ly", "cutt.ly", "shorturl.at",
  ];
  const KEYWORDS = [
    "login", "signin", "verify", "secure", "account", "update", "confirm",
    "banking", "password", "wallet", "billing", "support", "suspend", "invoice",
  ];

  /*=============== FORMAT ANALYSIS (runs in the browser) ===============*/
  const analyzeFormat = (raw) => {
    const checks = [];
    const add = (status, label, detail) => checks.push({ status, label, detail });

    if (/\s/.test(raw)) {
      add("bad", "Valid URL structure", "Contains spaces, which a real link never does.");
      return { valid: false, checks };
    }

    const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw);
    let parsed;
    try {
      parsed = new URL(hasScheme ? raw : "http://" + raw);
    } catch {
      add("bad", "Valid URL structure", "This can't be parsed as a URL.");
      return { valid: false, checks };
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      add("bad", "Valid URL structure", `Unusual scheme "${parsed.protocol}" (expected http or https).`);
      return { valid: false, checks };
    }

    const host = parsed.hostname.toLowerCase();
    const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[");
    const labels = host.split(".");

    if (!isIp && labels.length < 2) {
      add("bad", "Valid URL structure", `"${host}" is not a full domain name.`);
      return { valid: false, checks };
    }

    add("ok", "Valid URL structure", hasScheme ? "Parsed correctly." : "Parsed correctly (scheme was missing, assumed http).");

    // Scheme
    if (!hasScheme) add("warn", "Scheme", "No http/https given.");
    else if (parsed.protocol === "https:") add("ok", "Uses HTTPS", "Encrypted, though phishing sites use HTTPS too.");
    else add("warn", "Uses HTTPS", "Plain http: traffic is not encrypted.");

    // IP host
    if (isIp) add("bad", "Domain name", "Host is a raw IP address instead of a domain.");
    else add("ok", "Domain name", `Host is ${host}`);

    // @ symbol / userinfo
    if (raw.includes("@") || parsed.username) add("bad", "@ symbol", "Text before @ can hide the real destination.");
    else add("ok", "@ symbol", "None.");

    // Length
    const len = raw.length;
    if (len > 100) add("bad", "URL length", `${len} characters (very long).`);
    else if (len > 75) add("warn", "URL length", `${len} characters (long).`);
    else add("ok", "URL length", `${len} characters.`);

    // Subdomains
    if (!isIp) {
      const subs = Math.max(0, labels.length - 2);
      if (subs >= 3) add("bad", "Subdomains", `${subs} subdomain levels, often used to fake a brand.`);
      else if (subs === 2) add("warn", "Subdomains", "2 subdomain levels.");
      else add("ok", "Subdomains", `${subs} subdomain level${subs === 1 ? "" : "s"}.`);
    }

    // Hyphens in host
    const hyphens = (host.match(/-/g) || []).length;
    if (hyphens >= 3) add("bad", "Hyphens in domain", `${hyphens} hyphens.`);
    else if (hyphens === 2) add("warn", "Hyphens in domain", "2 hyphens.");
    else add("ok", "Hyphens in domain", hyphens ? "1 hyphen." : "None.");

    // Punycode
    if (host.includes("xn--")) add("bad", "Punycode", "Contains look-alike (internationalised) characters.");

    // Shortener
    if (SHORTENERS.some((s) => host === s || host.endsWith("." + s))) {
      add("warn", "URL shortener", "Hides the final destination.");
    }

    // Keywords
    const hay = (host + parsed.pathname + parsed.search).toLowerCase();
    const found = KEYWORDS.filter((k) => hay.includes(k));
    if (found.length >= 2) add("bad", "Suspicious keywords", found.join(", "));
    else if (found.length === 1) add("warn", "Suspicious keywords", found[0]);
    else add("ok", "Suspicious keywords", "None.");

    // Redirect trick
    if (parsed.pathname.includes("//")) add("warn", "Double slash in path", "Can indicate a redirect trick.");

    return { valid: true, host, checks };
  };

  /*=============== RENDER HELPERS ===============*/
  const renderChecks = (listEl, checks) => {
    listEl.innerHTML = "";
    if (!checks.length) {
      const li = document.createElement("li");
      li.className = "ph-checks__empty";
      li.textContent = "No data.";
      listEl.appendChild(li);
      return;
    }
    checks.forEach(({ status, label, detail }) => {
      const li = document.createElement("li");
      li.className = "ph-check";

      const icon = document.createElement("i");
      icon.className = `bx ${ICONS[status]} ph-${status}`;

      const body = document.createElement("div");
      const l = document.createElement("span");
      l.className = "ph-check__label";
      l.textContent = label;
      const d = document.createElement("span");
      d.className = "ph-check__detail";
      d.textContent = detail || "";
      body.append(l, d);

      li.append(icon, body);
      listEl.appendChild(li);
    });
  };

  const setStatus = (msg, isError = false) => {
    statusEl.textContent = msg;
    statusEl.classList.toggle("is-error", isError);
  };

  const setState = (cls, iconName, verdict, pct) => {
    [iconEl, fillEl].forEach((el) => {
      el.classList.remove(...STATE_CLASSES);
      if (cls) el.classList.add(cls);
    });
    iconEl.innerHTML = `<i class='bx ${iconName}'></i>`;
    verdictEl.textContent = verdict;
    if (pct == null) {
      pctEl.textContent = "--";
      fillEl.style.width = "0";
    } else {
      pctEl.textContent = `${pct}%`;
      fillEl.style.width = `${pct}%`;
    }
  };

  const resetOutput = () => {
    setState(null, "bx-shield-quarter", "--", null);
    setStatus("Enter a URL and press Analyze.");
    formatEl.innerHTML = "";
    domainEl.innerHTML = "";
  };

  /*=============== MODEL RESPONSE ===============*/
  const parseResponse = (data) => {
    const verdictText = String(data.verdict ?? data.prediction ?? "").toLowerCase();
    const isPhish = /phish|malicious|bad|^1$/.test(verdictText);

    let p = data.phishing_probability;
    if (typeof p !== "number" && typeof data.probability === "number") {
      p = isPhish ? data.probability : 1 - data.probability;
    }
    if (typeof p !== "number") p = isPhish ? 1 : 0;

    return { p, domain: data.domain ?? null };
  };

  const domainChecks = (domain) => {
    if (!domain) return [];
    const checks = [];

    if (domain.resolves === true) {
      const ips = Array.isArray(domain.ips) && domain.ips.length ? domain.ips.slice(0, 2).join(", ") : "";
      checks.push({ status: "ok", label: "Domain is live", detail: ips ? `Resolves to ${ips}` : "DNS lookup succeeded." });
    } else if (domain.resolves === false) {
      checks.push({
        status: "warn",
        label: "Domain not found",
        detail: "No DNS record, so this domain isn't serving anything right now.",
      });
    }

    if (typeof domain.age_days === "number") {
      const d = domain.age_days;
      const text = d >= 365 ? `${(d / 365).toFixed(1)} years old` : `${d} day${d === 1 ? "" : "s"} old`;
      if (d < 30) checks.push({ status: "bad", label: "Domain age", detail: `${text}. Very new domains are a common phishing sign.` });
      else if (d < 180) checks.push({ status: "warn", label: "Domain age", detail: `${text}.` });
      else checks.push({ status: "ok", label: "Domain age", detail: `${text}.` });
    } else if (domain.resolves) {
      checks.push({ status: "warn", label: "Domain age", detail: "Registration date unavailable." });
    }

    return checks;
  };

  /*=============== SUBMIT ===============*/
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const raw = urlEl.value.trim();

    if (!raw) {
      setStatus("Enter a URL first.", true);
      return;
    }

    // Step 1: instant format check
    const format = analyzeFormat(raw);
    renderChecks(formatEl, format.checks);
    domainEl.innerHTML = "";

    if (!format.valid) {
      setState("ph-bad", "bx-x-circle", "Invalid URL", null);
      setStatus("That doesn't look like a valid URL, so it wasn't sent to the model.", true);
      return;
    }

    // Step 2: model + domain checks on the backend
    analyzeBtn.disabled = true;
    setState(null, "bx-loader-alt bx-spin", "Analyzing...", null);
    setStatus("Running the model and domain checks...");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: raw }),
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);

      const { p, domain } = parseResponse(await res.json());
      const pct = Math.round(p * 1000) / 10;

      if (p >= 0.7) {
        setState("ph-bad", "bx-error-circle", "Likely phishing", pct);
        setStatus("Do not enter any personal information on this site.");
      } else if (p >= 0.4) {
        setState("ph-warn", "bx-error", "Suspicious", pct);
        setStatus("Some signs of phishing. Be careful with this link.");
      } else {
        setState("ph-ok", "bx-check-shield", "Looks safe", pct);
        setStatus("No strong phishing signs found. No tool is perfect, so stay alert.");
      }

      renderChecks(domainEl, domainChecks(domain));
    } catch (err) {
      console.error(err);
      setState(null, "bx-wifi-off", "Model offline", null);
      setStatus("Couldn't reach the model. Only the format check above is available.", true);
      renderChecks(domainEl, []);
    } finally {
      analyzeBtn.disabled = false;
    }
  });

  clearBtn.addEventListener("click", () => {
    urlEl.value = "";
    resetOutput();
    urlEl.focus();
  });

  examplesEl.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      urlEl.value = btn.dataset.url;
      form.requestSubmit();
    });
  });
})();