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
  if (!IS_LOCAL) fetch(API_BASE, { mode: "no-cors" }).catch(() => { });

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


// earthquakeee
(() => {
  const mapEl = document.getElementById("eq-map");
  if (!mapEl || typeof L === "undefined") return;

  /*---------- Settings ----------*/
  const IS_LOCAL = ["", "localhost", "127.0.0.1"].includes(location.hostname);
  const API_BASE = IS_LOCAL
    ? "http://127.0.0.1:5000"
    : "https://prashant-ml-api.onrender.com";
  const PREDICT_URL = `${API_BASE}/api/earthquake_predict`;
  const USGS_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query";
  const NOMINATIM = "https://nominatim.openstreetmap.org";

  // Start loading the model as soon as the page opens
  fetch(`${API_BASE}/api/earthquake_warmup`).catch(() => { });

  const NEPAL = { minLat: 26.0, maxLat: 30.5, minLon: 80.0, maxLon: 88.5 };
  const CENTER = [28.39, 84.12];
  const DEFAULT_MSG = "Type a place, type coordinates, or click the map. They fill each other in.";

  const LEVELS = {
    low: { cls: "eq-low", icon: "bx-check-shield", color: "#4ade80" },
    moderate: { cls: "eq-moderate", icon: "bx-error", color: "#facc15" },
    high: { cls: "eq-high", icon: "bx-error-alt", color: "#f87171" },
  };

  const FEATURE_LABELS = {
    latitude: "Latitude",
    longitude: "Longitude",
    depth: "Last quake depth",
    mag: "Last quake magnitude",
    days_since_last: "Days since last quake",
    rolling_mag_avg: "Recent avg magnitude",
    rolling_depth_avg: "Recent avg depth",
  };

  /*---------- Elements ----------*/
  const form = document.getElementById("eq-form");
  const placeEl = document.getElementById("eq-place");
  const searchBtn = document.getElementById("eq-search");
  const latEl = document.getElementById("eq-latitude");
  const lonEl = document.getElementById("eq-longitude");
  const msgEl = document.getElementById("eq-msg");
  const predictBtn = document.getElementById("eq-predict");

  const iconEl = document.getElementById("eq-icon");
  const levelEl = document.getElementById("eq-level");
  const statusEl = document.getElementById("eq-status");
  const fillEl = document.getElementById("eq-meter-fill");
  const pctEl = document.getElementById("eq-meter-pct");
  const statsEl = document.getElementById("eq-stats");
  const barsEl = document.getElementById("eq-bars");

  const bannerEl = document.getElementById("eq-banner");
  const alertsListEl = document.getElementById("eq-alerts-list");
  const alertsTimeEl = document.getElementById("eq-alerts-time");

  const isDark = () => !document.body.classList.contains("light-theme");

  const map = L.map(mapEl, {
    center: CENTER,
    zoom: 7,
    minZoom: 6,
    maxBounds: [[25.5, 79.5], [31, 89]],
    maxBoundsViscosity: 0.8,
  });

  const TILES = {
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    light: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  };
  const tiles = L.tileLayer(isDark() ? TILES.dark : TILES.light, {
    maxZoom: 19,
    subdomains: "abcd",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  }).addTo(map);

  // swap map style when the theme button is clicked
  document.getElementById("theme-button").addEventListener("click", () => {
    setTimeout(() => tiles.setUrl(isDark() ? TILES.dark : TILES.light), 0);
  });


  const defaultIcon = new L.Icon.Default();
  const riskLayer = L.layerGroup().addTo(map);   // risk box
  const quakeLayer = L.layerGroup().addTo(map);  // recent quakes near the point
  const alertLayer = L.layerGroup().addTo(map);  // quake picked from the live list
  let marker = null;

  /*---------- State ----------*/
  let current = null;        // { lat, lon, inNepal }
  let placeDirty = false;    // true when the place text was typed but not searched yet
  let geoToken = 0;          // used to ignore out-of-date lookups
  let pendingGeo = Promise.resolve();
  let coordTimer = null;

  /*---------- Small helpers ----------*/
  function setMsg(text, isError = false) {
    msgEl.textContent = text;
    msgEl.classList.toggle("is-error", isError);
  }

  function setStatus(text, isError = false) {
    statusEl.textContent = text;
    statusEl.classList.toggle("is-error", isError);
  }

  const inBox = (lat, lon) =>
    lat >= NEPAL.minLat && lat <= NEPAL.maxLat && lon >= NEPAL.minLon && lon <= NEPAL.maxLon;

  function parseCoord(value) {
    const n = parseFloat(String(value).trim().replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }

  function resetResult() {
    iconEl.className = "hcr-output__char eq-output__icon";
    iconEl.innerHTML = "<i class='bx bx-pulse'></i>";
    levelEl.textContent = "--";
    setStatus("Pick a place on the map and press Predict.");
    fillEl.className = "eq-meter__fill";
    fillEl.style.width = "0";
    pctEl.textContent = "--";
    statsEl.replaceChildren();
    barsEl.replaceChildren();
    quakeLayer.clearLayers();
    riskLayer.clearLayers();
    if (marker) {
      marker.setIcon(defaultIcon);
      marker.unbindPopup();
    }
  }

  /*---------- Name from coordinates (reverse lookup) ----------*/
  async function reverseGeocode(lat, lon) {
    const token = ++geoToken;
    setMsg("Looking up the place name...");

    try {
      const params = new URLSearchParams({
        lat: lat.toFixed(5),
        lon: lon.toFixed(5),
        format: "jsonv2",
        zoom: "12",
        addressdetails: "1",
        "accept-language": "en",
      });
      const res = await fetch(`${NOMINATIM}/reverse?${params}`);
      const data = await res.json();
      if (token !== geoToken) return; // a newer choice replaced this one

      const a = data.address || {};

      if (a.country_code && a.country_code !== "np") {
        if (current) current.inNepal = false;
        placeEl.value = "";
        setMsg("That point is outside Nepal. Pick a place inside the country.", true);
        return;
      }

      const name = a.city || a.town || a.village || a.municipality || a.hamlet || a.suburb || a.county || "";
      const region = a.state_district || a.state || "";
      const label = [name, region].filter(Boolean).join(", ");

      placeEl.value = label;
      placeDirty = false;
      setMsg(label ? `Selected ${lat.toFixed(4)}, ${lon.toFixed(4)}` : "No place name here, but the coordinates still work.");
    } catch (error) {
      console.error(error);
      if (token === geoToken) setMsg("Could not look up the place name. The coordinates still work.");
    }
  }

  /*---------- Choosing a location ----------*/
  // write:  put the numbers into the lat/lon boxes
  // lookup: find the place name for these numbers
  function applyCoords(lat, lon, { fly = false, write = true, lookup = true } = {}) {
    geoToken++; // cancel any older lookup

    if (!inBox(lat, lon)) {
      current = null;
      setMsg("Coordinates must be inside Nepal (latitude 26 to 30.5, longitude 80 to 88.5).", true);
      return false;
    }

    current = { lat, lon, inNepal: true };

    if (write) {
      latEl.value = lat.toFixed(4);
      lonEl.value = lon.toFixed(4);
    }

    if (marker) {
      marker.setLatLng([lat, lon]);
      marker.setIcon(defaultIcon);
      marker.unbindPopup();
    } else {
      marker = L.marker([lat, lon]).addTo(map);
    }

    quakeLayer.clearLayers();
    riskLayer.clearLayers();

    if (fly) map.flyTo([lat, lon], Math.max(map.getZoom(), 9));

    pendingGeo = lookup ? reverseGeocode(lat, lon) : Promise.resolve();
    return true;
  }

  // 1) click on the map
  map.on("click", (e) => {
    const p = e.latlng.wrap();
    applyCoords(p.lat, p.lng);
  });

  // 2) type a place name
  // Common places: found instantly, and they work even if the online lookup is blocked
  const PLACES = {
    "kathmandu": [27.7172, 85.3240],
    "pokhara": [28.2096, 83.9856],
    "lalitpur": [27.6588, 85.3247],
    "patan": [27.6588, 85.3247],
    "bhaktapur": [27.6710, 85.4298],
    "biratnagar": [26.4525, 87.2718],
    "birgunj": [27.0104, 84.8770],
    "bharatpur": [27.6833, 84.4333],
    "butwal": [27.7006, 83.4483],
    "dharan": [26.8065, 87.2846],
    "janakpur": [26.7288, 85.9260],
    "hetauda": [27.4287, 85.0322],
    "nepalgunj": [28.0500, 81.6167],
    "dhangadhi": [28.6833, 80.6000],
    "lumbini": [27.4833, 83.2760],
    "gorkha": [28.0000, 84.6333],
    "dhulikhel": [27.6195, 85.5380],
    "namche bazaar": [27.8069, 86.7140],
    "lukla": [27.6881, 86.7314],
    "jomsom": [28.7800, 83.7230],
  };

  async function searchPlace() {
    const q = placeEl.value.trim();
    if (!q) {
      setMsg("Type a place name first.", true);
      return false;
    }

    console.log("[earthquake] searching for:", q);
    searchBtn.disabled = true;
    setMsg("Searching...");

    try {
      // 1) built-in list
      const known = PLACES[q.toLowerCase().replace(/,.*$/, "").trim()];
      if (known) {
        applyCoords(known[0], known[1], { fly: true, lookup: false });
        placeDirty = false;
        setMsg(`Found: ${q}`);
        return true;
      }

      // 2) online lookup (OpenStreetMap), with an 8 second limit
      const params = new URLSearchParams({
        q, format: "json", limit: "1", countrycodes: "np", "accept-language": "en",
      });
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      let res;
      try {
        res = await fetch(`${NOMINATIM}/search?${params}`, { signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }
      if (!res.ok) throw new Error(`Lookup service responded ${res.status}`);

      const list = await res.json();
      if (!list.length) {
        setMsg(`Could not find "${q}" in Nepal. Try a bigger nearby town.`, true);
        return false;
      }

      const p = list[0];
      applyCoords(parseFloat(p.lat), parseFloat(p.lon), { fly: true, lookup: false });
      placeDirty = false;
      setMsg(`Found: ${p.display_name.split(",").slice(0, 2).join(",")}`);
      return true;
    } catch (error) {
      console.error("[earthquake] search failed:", error);
      setMsg("Online place lookup failed. Try a bigger city, type coordinates, or click the map.", true);
      return false;
    } finally {
      searchBtn.disabled = false;
    }
  }

  placeEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // search, don't submit the form
      searchPlace();
    }
  });

  placeEl.addEventListener("input", () => {
    placeDirty = true;
  });

  // 3) type coordinates (applies after you stop typing for a moment)
  function applyTypedCoords() {
    const lat = parseCoord(latEl.value);
    const lon = parseCoord(lonEl.value);

    if (
      lat !== null && lon !== null &&
      (!current || Math.abs(current.lat - lat) > 0.0001 || Math.abs(current.lon - lon) > 0.0001)
    ) {
      if (latEl.value.trim() || lonEl.value.trim()) {
        setMsg("Enter both latitude and longitude as numbers.");
      }
      return;
    }

    applyCoords(lat, lon, { fly: true, write: false });
  }

  function onCoordInput() {
    placeDirty = false; // the numbers are now the source of truth
    clearTimeout(coordTimer);
    coordTimer = setTimeout(applyTypedCoords, 800);
  }

  [latEl, lonEl].forEach((el) => {
    el.addEventListener("input", onCoordInput);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        clearTimeout(coordTimer);
        applyTypedCoords();
      }
    });
  });

  /*---------- Showing the result ----------*/
  function makeStat(value, label) {
    const box = document.createElement("div");
    box.className = "eq-stat";
    const strong = document.createElement("strong");
    strong.textContent = value;
    const span = document.createElement("span");
    span.textContent = label;
    box.append(strong, span);
    return box;
  }

  function makeBar(factor, maxAbs) {
    const row = document.createElement("div");
    row.className = "hcr-bar";

    const name = document.createElement("span");
    name.className = "hcr-bar__char";
    name.textContent = FEATURE_LABELS[factor.feature] || factor.feature;

    const track = document.createElement("div");
    track.className = "hcr-bar__track";
    const fill = document.createElement("div");
    fill.className = "hcr-bar__fill " + (factor.impact >= 0 ? "is-up" : "is-down");
    fill.dataset.width = `${(Math.abs(factor.impact) / maxAbs) * 100}%`;
    track.appendChild(fill);

    const val = document.createElement("span");
    val.className = "hcr-bar__pct";
    val.textContent = (factor.impact >= 0 ? "+" : "") + factor.impact.toFixed(2);

    row.append(name, track, val);
    return row;
  }

  // Colored pin + dashed box showing the area the model looked at
  function drawRisk(data, level) {
    const { lat, lon } = current;

    riskLayer.clearLayers();
    const box = L.rectangle([[lat - 1, lon - 1], [lat + 1, lon + 1]], {
      color: level.color,
      weight: 2,
      dashArray: "6 6",
      fillColor: level.color,
      fillOpacity: 0.12,
      interactive: false,
    }).addTo(riskLayer);

    const pin = L.divIcon({
      className: "",
      html: `<div class="eq-pin eq-pin--${data.level}">${data.risk_score}</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
    marker.setIcon(pin);

    const popup = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = `Risk ${data.risk_score}/100`;
    popup.append(strong, document.createTextNode(` · ${data.label}`));
    marker.bindPopup(popup);

    map.fitBounds(box.getBounds(), { padding: [20, 20] });
  }

  function showResult(data) {
    const level = LEVELS[data.level] || LEVELS.low;

    iconEl.className = `hcr-output__char eq-output__icon ${level.cls}`;
    iconEl.innerHTML = `<i class='bx ${level.icon}'></i>`;
    levelEl.textContent = data.label;
    setStatus(data.advice);

    fillEl.className = `eq-meter__fill ${level.cls}`;
    fillEl.style.width = `${data.risk_score}%`;
    pctEl.textContent = data.risk_score;

    statsEl.replaceChildren(
      makeStat(
        data.nearby_count === 0 ? "60+" : data.days_since_last,
        "days since last quake nearby"
      ),
      makeStat(data.rolling_mag.toFixed(1), "avg magnitude, last 5"),
      makeStat(data.nearby_count, "quakes within ~110 km (60 days)")
    );

    const top = (data.factors || []).slice(0, 5);
    const maxAbs = Math.max(0.0001, ...top.map((f) => Math.abs(f.impact)));
    barsEl.replaceChildren(...top.map((f) => makeBar(f, maxAbs)));
    setTimeout(() => {
      barsEl.querySelectorAll(".hcr-bar__fill").forEach((fill) => {
        fill.style.width = fill.dataset.width;
      });
    }, 30);

    drawRisk(data, level);

    // Recent nearby earthquakes
    quakeLayer.clearLayers();
    (data.recent || []).forEach((q) => {
      const popup = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = `M${q.mag}`;
      popup.append(strong, document.createTextNode(` ${q.place} (depth ${q.depth} km)`));

      L.circleMarker([q.lat, q.lon], {
        radius: Math.max(5, q.mag * 2.5),
        color: "#f87171",
        fillColor: "#f87171",
        fillOpacity: 0.35,
        weight: 1,
      })
        .bindPopup(popup)
        .addTo(quakeLayer);
    });

    // On phones the map is below the form, so bring it into view
    // bring the result into view
    document.querySelector(".eq-output").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /*---------- Predict ----------*/
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearTimeout(coordTimer);
    predictBtn.disabled = true;

    try {
      // A place name was typed but not searched yet: search it first
      if (placeDirty && placeEl.value.trim()) {
        setStatus("Looking up the place...");
        const found = await searchPlace();
        if (!found) {
          setStatus("Could not find that place. Check the spelling or click the map.", true);
          return;
        }
      }

      // Coordinates typed but not applied yet
      const lat = parseCoord(latEl.value);
      const lon = parseCoord(lonEl.value);
      if (lat !== null && lon !== null && (!current || current.lat !== lat || current.lon !== lon)) {
        if (!applyCoords(lat, lon, { fly: true, write: false })) {
          setStatus("Those coordinates are outside Nepal.", true);
          return;
        }
      }

      if (!current) {
        setStatus("Enter a place name or coordinates first.", true);
        return;
      }

      await pendingGeo; // wait for the "is this Nepal?" check
      if (!current.inNepal) {
        setStatus("That point is outside Nepal. Pick a place inside the country.", true);
        return;
      }

      setStatus("Fetching live USGS data and running the model...");
      const slowTimer = setTimeout(
        () => setStatus("Server is waking up (free hosting). First request can take ~30s..."),
        4000
      );

      try {
        const response = await fetch(PREDICT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude: current.lat, longitude: current.lon }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.error) {
          throw new Error(data.error || `Server error (${response.status})`);
        }

        showResult(data);
      } finally {
        clearTimeout(slowTimer);
      }
    } catch (error) {
      console.error(error);
      const offline = error instanceof TypeError;
      setStatus(offline ? "Could not reach the model server." : error.message, true);
    } finally {
      predictBtn.disabled = false;
    }
  });

  /*---------- Reset ----------*/
  form.addEventListener("reset", () => {
    // wait one tick so the browser clears the inputs first
    setTimeout(() => {
      geoToken++;
      current = null;
      placeDirty = false;
      if (marker) {
        map.removeLayer(marker);
        marker = null;
      }
      setMsg(DEFAULT_MSG);
      resetResult();
      map.setView(CENTER, 7);
    }, 0);
  });

  /*---------- LIVE ALERTS (USGS) ----------*/
  function timeAgo(ms) {
    const mins = Math.round((Date.now() - ms) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours} h ago`;
    return `${Math.round(hours / 24)} d ago`;
  }

  const magClass = (m) => (m >= 5 ? "eq-high" : m >= 4 ? "eq-moderate" : "eq-low");

  function showAlertOnMap(q) {
    alertLayer.clearLayers();

    const popup = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = `M${q.mag.toFixed(1)}`;
    popup.append(strong, document.createTextNode(` ${q.place} · ${timeAgo(q.time)}`));

    const circle = L.circleMarker([q.lat, q.lon], {
      radius: Math.max(8, q.mag * 3),
      color: "#f87171",
      fillColor: "#f87171",
      fillOpacity: 0.35,
      weight: 2,
    })
      .bindPopup(popup)
      .addTo(alertLayer);

    map.flyTo([q.lat, q.lon], Math.max(map.getZoom(), 8));
    circle.openPopup();
    mapEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function renderAlerts(features) {
    const quakes = features
      .filter((f) => f.properties.mag != null)
      .map((f) => ({
        mag: Number(f.properties.mag),
        place: f.properties.place || "Unknown location",
        time: f.properties.time,
        lon: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
        depth: f.geometry.coordinates[2],
      }));

    // Banner: any M4.5+ in the last 24 hours?
    const strong = quakes.find((q) => q.mag >= 4.5 && Date.now() - q.time < 864e5);
    bannerEl.hidden = false;
    if (strong) {
      bannerEl.className = "eq-banner is-alert";
      bannerEl.textContent = `Alert: M${strong.mag.toFixed(1)} earthquake, ${strong.place}, ${timeAgo(strong.time)}.`;
    } else {
      bannerEl.className = "eq-banner is-calm";
      bannerEl.textContent = "No M4.5+ earthquakes in the Nepal region in the last 24 hours.";
    }

    alertsListEl.replaceChildren();

    if (!quakes.length) {
      const li = document.createElement("li");
      li.className = "hcr-hint";
      li.textContent = "No earthquakes of magnitude 2.5+ in the last 7 days.";
      alertsListEl.appendChild(li);
      return;
    }

    quakes.forEach((q) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "eq-alert";

      const mag = document.createElement("span");
      mag.className = `eq-alert__mag ${magClass(q.mag)}`;
      mag.textContent = q.mag.toFixed(1);

      const body = document.createElement("div");
      const place = document.createElement("span");
      place.className = "eq-alert__place";
      place.textContent = q.place;
      const meta = document.createElement("span");
      meta.className = "eq-alert__meta";
      meta.textContent = `${timeAgo(q.time)} · depth ${Math.round(q.depth)} km`;
      body.append(place, meta);

      btn.append(mag, body);
      btn.addEventListener("click", () => showAlertOnMap(q));
      li.appendChild(btn);
      alertsListEl.appendChild(li);
    });
  }

  async function loadAlerts() {
    const params = new URLSearchParams({
      format: "geojson",
      minlatitude: NEPAL.minLat,
      maxlatitude: NEPAL.maxLat,
      minlongitude: NEPAL.minLon,
      maxlongitude: NEPAL.maxLon,
      minmagnitude: "2.5",
      orderby: "time",
      limit: "15",
      starttime: new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 19),
    });

    try {
      const res = await fetch(`${USGS_URL}?${params}`);
      if (!res.ok) throw new Error(`USGS responded ${res.status}`);
      const json = await res.json();
      renderAlerts(json.features || []);
      alertsTimeEl.textContent =
        "Updated " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (error) {
      console.error(error);
      alertsTimeEl.textContent = "Could not load live data";
    }
  }

  loadAlerts();
  setInterval(() => {
    if (!document.hidden) loadAlerts(); // don't poll while the tab is hidden
  }, 60000);

  /*---------- Start ----------*/
  setMsg(DEFAULT_MSG);
  resetResult();
})();


/*=============== RAG ASSISTANT DEMO ===============*/
(() => {
  // ---- CONFIG: change to your backend ----
    const IS_LOCAL = ["", "localhost", "127.0.0.1"].includes(location.hostname);
  const API_BASE = IS_LOCAL
    ? "http://127.0.0.1:5000"
    : "https://prashant-ml-api.onrender.com";
  const API_URL = `${API_BASE}/api/rag_error`;

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

    fetch(`${API_BASE}/api/rag_error_warmup`).catch(() => { });

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

        const slowTimer = setTimeout(
      () => setStatus("Server is waking up (free hosting). First request can take ~30s..."),
      4000
    );

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || `Server error (${res.status})`);
      }

      const { answer, sources } = parseResponse(data);
      typing.remove();
      addMessage(answer || "I couldn't find an answer to that.", "bot");
      stopSteps(true);
      renderSources(sources);

      if (data.mode === "retrieval-only") {
        setStatus("AI writer unavailable, showing the best matching record.");
      }
    } catch (err) {
      console.error(err);
      typing.remove();
      const offline = err instanceof TypeError;
      addMessage(
        offline
          ? "I couldn't reach the assistant. The server may be waking up, so try again in a moment."
          : err.message,
        "bot",
        true
      );
      stopSteps(false);
      setStatus("Request failed.", true);
    } finally {
      clearTimeout(slowTimer);
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
  const IS_LOCAL = ["", "localhost", "127.0.0.1"].includes(location.hostname);
  const API_BASE = IS_LOCAL
    ? "http://127.0.0.1:5000"
    : "https://prashant-ml-api.onrender.com";
  const API_URL = `${API_BASE}/api/phishing`;

  const form = document.getElementById("ph-form");
  if (!form) return;

  fetch(`${API_BASE}/api/phishing_warmup`).catch(() => { });

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
  const formatLabelEl = document.getElementById("ph-format-label");

  const STATE_CLASSES = ["ph-ok", "ph-warn", "ph-bad"];
    const ICONS = {
    ok: "bx-check-circle",
    warn: "bx-error",
    bad: "bx-x-circle",
    info: "bx-info-circle",
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
      add("bad", "Link is not well-formed", "It contains spaces, which a real link never does.");
      return { valid: false, checks };
    }

    const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw);
    let parsed;
    try {
      parsed = new URL(hasScheme ? raw : "http://" + raw);
    } catch {
      add("bad", "Link is not well-formed", "This can't be read as a web address.");
      return { valid: false, checks };
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      add("bad", "Link is not well-formed", `It starts with "${parsed.protocol}" instead of http or https.`);
      return { valid: false, checks };
    }

    const host = parsed.hostname.toLowerCase();
    const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[");
    const labels = host.split(".");

    if (!isIp && labels.length < 2) {
      add("bad", "Link is not well-formed", `"${host}" is not a full domain name.`);
      return { valid: false, checks };
    }

    add(
      "ok",
      "Link is well-formed",
      hasScheme
        ? "The address can be read correctly."
        : "You didn't type http:// or https://, so we assumed http. That is not a warning sign."
    );

    // Protocol (only judged when the visitor typed one)
    if (hasScheme) {
      if (parsed.protocol === "https:") {
        add("ok", "Uses HTTPS", "The connection is encrypted. Phishing sites can use HTTPS too, so this alone proves little.");
      } else {
        add("warn", "Uses plain HTTP", "Not encrypted. Real login pages almost always use HTTPS.");
      }
    }

    // IP address instead of a name
    if (isIp) add("bad", "Uses an IP address", "Real sites use names like example.com, not numbers.");
    else add("ok", "Normal domain name", `The domain is ${host}.`);

    // @ trick
    if (raw.includes("@") || parsed.username) {
      add("bad", "Contains an @ symbol", "Browsers ignore everything before @, so it can hide the real destination.");
    } else {
      add("ok", "No @ trick", "Nothing in the link hides the real destination.");
    }

    // Length
    const len = raw.length;
    if (len > 100) add("bad", "Very long link", `${len} characters. Long links can bury the real domain.`);
    else if (len > 75) add("warn", "Long link", `${len} characters. Check the domain carefully.`);
    else add("ok", "Reasonable length", `${len} characters.`);

    // Subdomains
    if (!isIp) {
      const subs = Math.max(0, labels.length - 2);
      if (subs >= 3) add("bad", "Many subdomains", `${subs} levels. Attackers stack them to fake a brand, like paypal.com.evil.net.`);
      else if (subs === 2) add("warn", "Two subdomains", "Check that the last two parts of the domain are the brand you expect.");
      else if (subs === 1) add("ok", "One subdomain", "For example mail.example.com. This is normal.");
      else add("ok", "No extra subdomains", "Just the main domain.");
    }

    // Hyphens
    const hyphens = (host.match(/-/g) || []).length;
    if (hyphens >= 3) add("bad", "Many hyphens in the domain", `${hyphens} hyphens. Fake domains often chain words like secure-login-update.`);
    else if (hyphens === 2) add("warn", "Two hyphens in the domain", "A mild hint. Real brands rarely need them.");
    else add("ok", "Few hyphens", hyphens ? "Only one hyphen." : "No hyphens in the domain.");

    // Look-alike characters
    if (host.includes("xn--")) {
      add("bad", "Look-alike characters", "The domain uses special characters that can imitate real letters.");
    }

    // Shorteners
    if (SHORTENERS.some((s) => host === s || host.endsWith("." + s))) {
      add("warn", "URL shortener", "The real destination is hidden behind this short link.");
    }

    // Keywords
    const hay = (host + parsed.pathname + parsed.search).toLowerCase();
    const found = KEYWORDS.filter((k) => hay.includes(k));
    if (found.length >= 2) add("bad", "Pressure words", `Contains: ${found.join(", ")}. Common in phishing, though real sites use them too.`);
    else if (found.length === 1) add("warn", "Pressure word", `Contains "${found[0]}". Only a hint, since real sites use it too.`);
    else add("ok", "No pressure words", "No words like login, verify or secure.");

    // Redirect trick
    if (parsed.pathname.includes("//")) {
      add("warn", "Double slash in the path", "Can be a redirect trick.");
    }

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
        const order = { bad: 0, warn: 1, info: 2, ok: 3 };
    [...checks].sort((a, b) => order[a.status] - order[b.status]).forEach(({ status, label, detail }) => {
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
      // show a short IPv4 address as the example, not the long IPv6 one
      const ips = Array.isArray(domain.ips)
        ? [...domain.ips].sort((a, b) => a.includes(":") - b.includes(":"))
        : [];
      const example = ips[0] ? ` (for example ${ips[0]})` : "";
      checks.push({
        status: "ok",
        label: "Domain name exists",
        detail: `This name points to a real server${example}. It proves the name is set up, not that the site is trustworthy.`,
      });
    } else if (domain.resolves === false) {
      checks.push({
        status: "warn",
        label: "Domain name not found",
        detail: "This name doesn't point to any server. It may be a typo, or a throwaway name that was already taken down.",
      });
    } else {
      checks.push({
        status: "info",
        label: "Domain lookup unavailable",
        detail: "We couldn't check this name right now.",
      });
    }

    if (typeof domain.age_days === "number") {
      const d = domain.age_days;
      const text = d >= 365 ? `${(d / 365).toFixed(1)} years old` : `${d} day${d === 1 ? "" : "s"} old`;
      if (d < 30) checks.push({ status: "bad", label: "Very new domain", detail: `${text}. Very new domains are a common phishing sign.` });
      else if (d < 180) checks.push({ status: "warn", label: "Fairly new domain", detail: `${text}. Established sites are usually older.` });
      else checks.push({ status: "ok", label: "Established domain", detail: `${text}. Phishing sites are often only days or weeks old.` });
    } else if (domain.resolves !== false) {
      checks.push({
        status: "info",
        label: "Domain age unknown",
        detail: "Some domain types (like .np) don't publish a registration date, so this is not a warning.",
      });
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
        const passed = format.checks.filter((c) => c.status === "ok").length;
    formatLabelEl.textContent = `URL format checks · ${passed} of ${format.checks.length} passed`;
    domainEl.innerHTML = "";

    if (!format.valid) {
      setState("ph-bad", "bx-x-circle", "Invalid URL", null);
      setStatus("That doesn't look like a valid URL, so it wasn't sent to the model.", true);
      return;
    }

    // Step 2: model + domain checks on the backend
    // Step 2: model + domain checks on the backend
    analyzeBtn.disabled = true;
    setState(null, "bx-loader-alt bx-spin", "Analyzing...", null);
    setStatus("Running the model and domain checks...");

    const slowTimer = setTimeout(
      () => setStatus("Server is waking up (free hosting). First request can take ~30s..."),
      4000
    );

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: raw }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || `Server error (${res.status})`);
      }

      const { p, domain } = parseResponse(data);
      const pct = Math.round(p * 1000) / 10;

            const dChecks = domainChecks(domain);

      // "Healthy": no failed or warned format checks, the domain exists,
      // and it has been registered for at least a year
      const formatClean = format.checks.every((c) => c.status === "ok" || c.status === "info");
      const domainHealthy =
        domain && domain.resolves === true &&
        typeof domain.age_days === "number" && domain.age_days >= 365;
      const healthy = formatClean && domainHealthy;

      // A very new domain is worth flagging even if the model likes the text
      const veryNew = domain && typeof domain.age_days === "number" && domain.age_days < 30;

      if (p >= 0.4 && healthy) {
        setState("ph-warn", "bx-error", "Mixed signals", pct);
        setStatus(
          "The model dislikes the link's text, but every format and domain check looks healthy. " +
          "The model reads only the text, so it can be wrong about well-known sites. Check the address carefully."
        );
      } else if (p >= 0.7) {
        setState("ph-bad", "bx-error-circle", "Likely phishing", pct);
        setStatus("Do not enter any personal information on this site.");
      } else if (p >= 0.4 || veryNew) {
        setState("ph-warn", "bx-error", "Suspicious", pct);
        setStatus(
          veryNew && p < 0.4
            ? "The link's text looks fine, but the domain was registered very recently."
            : "Some signs of phishing. Be careful with this link."
        );
      } else {
        setState("ph-ok", "bx-check-shield", "Looks safe", pct);
        setStatus("No strong phishing signs found. No tool is perfect, so stay alert.");
      }

      renderChecks(domainEl, dChecks);
    } catch (err) {
      console.error(err);
      const offline = err instanceof TypeError;
      setState(null, "bx-wifi-off", offline ? "Model offline" : "Error", null);
      setStatus(
        offline
          ? "Couldn't reach the model. Only the format check above is available."
          : err.message,
        true
      );
      renderChecks(domainEl, []);
    } finally {
      clearTimeout(slowTimer);
      analyzeBtn.disabled = false;
    }
  });

  clearBtn.addEventListener("click", () => {
    urlEl.value = "";
    resetOutput();
        formatLabelEl.textContent = "URL format checks";
    urlEl.focus();
  });

  examplesEl.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      urlEl.value = btn.dataset.url;
      form.requestSubmit();
    });
  });
})();


/*=============== CUSTOMER CHURN PREDICTION DEMO ===============*/
(() => {
  // ---- CONFIG: change to your backend ----
  const API_URL = "http://127.0.0.1:5000/predict-churn";

  /*
    Request:  POST JSON with the form fields (names match the inputs' name="" attributes):
      { tenure, monthly_charges, contract, internet_service,
        payment_method, tech_support, paperless_billing }

    Expected response (adjust parseResponse() if yours differs):
    {
      "prediction": "churn",              // "churn" | "stay"   (optional)
      "churn_probability": 0.78,          // 0-1
      "factors": [                        // optional: top drivers
        { "name": "Month-to-month contract", "impact": 0.31 },    // + raises churn risk
        { "name": "Tenure", "impact": -0.18 }                     // - lowers it
      ]
    }
  */

  const form = document.getElementById("ch-form");
  if (!form) return;

  const predictBtn = document.getElementById("ch-predict");
  const presetsEl = document.getElementById("ch-presets");

  const tenureEl = document.getElementById("ch-tenure");
  const monthlyEl = document.getElementById("ch-monthly");
  const tenureOut = document.getElementById("ch-tenure-out");
  const monthlyOut = document.getElementById("ch-monthly-out");

  const iconEl = document.getElementById("ch-icon");
  const verdictEl = document.getElementById("ch-verdict");
  const statusEl = document.getElementById("ch-status");
  const fillEl = document.getElementById("ch-meter-fill");
  const pctEl = document.getElementById("ch-meter-pct");
  const factorsWrap = document.getElementById("ch-factors-wrap");
  const factorsEl = document.getElementById("ch-factors");
  const tipsWrap = document.getElementById("ch-tips-wrap");
  const tipsEl = document.getElementById("ch-tips");

  const STATE_CLASSES = ["ch-ok", "ch-warn", "ch-bad"];

  const PRESETS = {
    loyal: {
      tenure: 60,
      monthly_charges: 55,
      contract: "Two year",
      internet_service: "DSL",
      payment_method: "Bank transfer (automatic)",
      tech_support: "Yes",
      paperless_billing: "No",
    },
    risky: {
      tenure: 2,
      monthly_charges: 95,
      contract: "Month-to-month",
      internet_service: "Fiber optic",
      payment_method: "Electronic check",
      tech_support: "No",
      paperless_billing: "Yes",
    },
  };

  /*=============== FORM HELPERS ===============*/
  const updateLabels = () => {
    const t = Number(tenureEl.value);
    tenureOut.textContent = `${t} month${t === 1 ? "" : "s"}`;
    monthlyOut.textContent = `$${monthlyEl.value}`;
  };

  tenureEl.addEventListener("input", updateLabels);
  monthlyEl.addEventListener("input", updateLabels);
  updateLabels();

  const getValues = () => ({
    tenure: Number(form.elements.tenure.value),
    monthly_charges: Number(form.elements.monthly_charges.value),
    contract: form.elements.contract.value,
    internet_service: form.elements.internet_service.value,
    payment_method: form.elements.payment_method.value,
    tech_support: form.elements.tech_support.value,
    paperless_billing: form.elements.paperless_billing.value,
  });

  const applyPreset = (values) => {
    Object.entries(values).forEach(([name, val]) => {
      form.elements[name].value = val;
    });
    updateLabels();
  };

  /*=============== OUTPUT HELPERS ===============*/
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
    setState(null, "bx-user", "--", null);
    setStatus("Set the details and press Predict.");
    factorsWrap.hidden = true;
    tipsWrap.hidden = true;
    factorsEl.innerHTML = "";
    tipsEl.innerHTML = "";
  };

  const parseResponse = (data) => {
    let p = data.churn_probability ?? data.probability;
    if (typeof p !== "number") {
      const pred = String(data.prediction ?? "").toLowerCase();
      p = /churn|yes|^1$/.test(pred) ? 1 : 0;
    }
    return { p, factors: Array.isArray(data.factors) ? data.factors : [] };
  };

  /*=============== FACTORS ===============*/
  const renderFactors = (factors) => {
    factorsEl.innerHTML = "";
    if (!factors.length) {
      factorsWrap.hidden = true;
      return;
    }
    factorsWrap.hidden = false;

    const top = [...factors]
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 5);
    const max = Math.max(...top.map((f) => Math.abs(f.impact))) || 1;

    top.forEach((f) => {
      const raises = f.impact > 0;
      const row = document.createElement("div");
      row.className = "ch-factor";

      const name = document.createElement("span");
      name.className = "ch-factor__name";
      name.textContent = f.name;

      const track = document.createElement("div");
      track.className = "ch-factor__track";
      const fill = document.createElement("div");
      fill.className = `ch-factor__fill ${raises ? "ch-bad" : "ch-ok"}`;
      track.appendChild(fill);

      const val = document.createElement("span");
      val.className = "ch-factor__val";
      val.textContent = `${raises ? "+" : "-"}${Math.abs(f.impact).toFixed(2)}`;

      row.append(name, track, val);
      factorsEl.appendChild(row);

      requestAnimationFrame(() => {
        fill.style.width = `${(Math.abs(f.impact) / max) * 100}%`;
      });
    });
  };

  /*=============== RETENTION TIPS (client-side, based on inputs) ===============*/
  const buildTips = (v) => {
    const tips = [];
    if (v.contract === "Month-to-month") tips.push("Offer a discount for moving to a one- or two-year contract.");
    if (v.tech_support === "No" && v.internet_service !== "No") tips.push("Offer a free trial of tech support.");
    if (v.tenure < 12) tips.push("Schedule an onboarding check-in during the first year.");
    if (v.monthly_charges > 85) tips.push("Review the plan and suggest a better-value bundle.");
    if (v.payment_method === "Electronic check") tips.push("Encourage automatic payments with a small credit.");
    if (!tips.length) tips.push("Reward loyalty with an exclusive perk or early upgrade.");
    return tips.slice(0, 3);
  };

  const renderTips = (values) => {
    tipsEl.innerHTML = "";
    tipsWrap.hidden = false;
    buildTips(values).forEach((text) => {
      const li = document.createElement("li");
      li.className = "ch-tip";
      const icon = document.createElement("i");
      icon.className = "bx bx-bulb";
      const span = document.createElement("span");
      span.textContent = text;
      li.append(icon, span);
      tipsEl.appendChild(li);
    });
  };

  /*=============== SUBMIT ===============*/
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const values = getValues();

    predictBtn.disabled = true;
    setState(null, "bx-loader-alt bx-spin", "Analyzing...", null);
    setStatus("Running the model...");
    factorsWrap.hidden = true;
    tipsWrap.hidden = true;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);

      const { p, factors } = parseResponse(await res.json());
      const pct = Math.round(p * 1000) / 10;

      if (p >= 0.6) {
        setState("ch-bad", "bx-user-x", "Likely to churn", pct);
        setStatus("High risk. This customer may leave soon.");
      } else if (p >= 0.35) {
        setState("ch-warn", "bx-user-minus", "At risk", pct);
        setStatus("Some warning signs. Worth reaching out.");
      } else {
        setState("ch-ok", "bx-user-check", "Likely to stay", pct);
        setStatus("Low churn risk for this profile.");
      }

      renderFactors(factors);
      if (p >= 0.35) renderTips(values);
    } catch (err) {
      console.error(err);
      setState(null, "bx-wifi-off", "Model offline", null);
      setStatus("Couldn't reach the model. Is the server running?", true);
    } finally {
      predictBtn.disabled = false;
    }
  });

  /*=============== EVENTS ===============*/
  presetsEl.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyPreset(PRESETS[btn.dataset.preset]);
      form.requestSubmit();
    });
  });

  form.addEventListener("reset", () => {
    // reset fires before values revert, so wait a tick
    setTimeout(updateLabels, 0);
    resetOutput();
  });
})();