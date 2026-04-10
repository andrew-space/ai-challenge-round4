(() => {
  "use strict";

  const ISS_API = "https://api.wheretheiss.at/v1/satellites/25544";
  const POLL_INTERVAL_MS = 30000;
  const ERROR_RETRY_MS = 45000;
  const REQUEST_TIMEOUT_MS = 8000;

  const R_EARTH_KM = 6371;
  const GM_KM3_S2 = 398600.4418;

  const dom = {
    status: document.getElementById("apiStatus"),
    liveStatus: document.getElementById("liveStatus"),
    liveDot: document.getElementById("liveDot"),
    altitude: document.getElementById("statAltitude"),
    velocity: document.getElementById("statVelocity"),
    period: document.getElementById("statPeriod"),
    visibility: document.getElementById("statVisibility"),
    coords: document.getElementById("statCoords")
  };

  let map = null;
  let issMarker = null;
  let issPath = [];
  let firstLoad = true;
  let pollTimer = null;
  let hasLiveFix = false;
  const MAX_PATH_POINTS = 120;

  function initMap() {
    map = new maplibregl.Map({
      container: "map",
      style: {
        version: 8,
        sources: {
          carto: {
            type: "raster",
            tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© CARTO © OpenStreetMap contributors"
          }
        },
        layers: [{ id: "carto-tiles", type: "raster", source: "carto" }]
      },
      center: [0, 20],
      zoom: 1.8,
      minZoom: 1,
      maxZoom: 6
    });

    map.on("load", () => {
      map.addSource("iss-path", {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "LineString", coordinates: [] } }
      });
      map.addLayer({
        id: "iss-path-layer",
        type: "line",
        source: "iss-path",
        paint: {
          "line-color": "#00e5ff",
          "line-width": 1.5,
          "line-opacity": 0.5,
          "line-dasharray": [4, 3]
        }
      });
    });

    const el = document.createElement("div");
    el.className = "iss-marker";
    el.setAttribute("aria-label", "ISS current position");
    el.innerHTML = `<svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
      <circle cx="16" cy="16" r="4" fill="#00e5ff"/>
      <line x1="4"  y1="16" x2="28" y2="16" stroke="#00e5ff" stroke-width="2"/>
      <line x1="16" y1="6"  x2="16" y2="26" stroke="#00e5ff" stroke-width="2"/>
      <line x1="8"  y1="10" x2="24" y2="10" stroke="#00e5ff" stroke-width="1.2" opacity=".6"/>
      <line x1="8"  y1="22" x2="24" y2="22" stroke="#00e5ff" stroke-width="1.2" opacity=".6"/>
    </svg>`;

    issMarker = new maplibregl.Marker({ element: el, anchor: "center" })
      .setLngLat([0, 0])
      .addTo(map);
  }

  function calcOrbitalPeriodMin(altitudeKm) {
    const r = R_EARTH_KM + altitudeKm;
    const tSec = 2 * Math.PI * Math.sqrt(Math.pow(r, 3) / GM_KM3_S2);
    return (tSec / 60).toFixed(1);
  }

  function setStatus(text, mode) {
    dom.status.textContent = text;
    dom.status.className = "status-dot" + (mode ? ` status-dot--${mode}` : "");
  }

  function updateStats(data) {
    const altitude = Number.parseFloat(data.altitude);
    const velocity = Number.parseFloat(data.velocity);
    const latitude = Number.parseFloat(data.latitude);
    const longitude = Number.parseFloat(data.longitude);

    if ([altitude, velocity, latitude, longitude].some(Number.isNaN)) {
      throw new Error("Invalid ISS payload");
    }

    const period = calcOrbitalPeriodMin(altitude);
    const visibility = data.visibility === "daylight" ? "Daylight" : "Eclipsed";
    const latLabel = latitude >= 0 ? `${latitude.toFixed(4)}°N` : `${Math.abs(latitude).toFixed(4)}°S`;
    const lngLabel = longitude >= 0 ? `${longitude.toFixed(4)}°E` : `${Math.abs(longitude).toFixed(4)}°W`;

    dom.altitude.textContent = altitude.toFixed(1);
    dom.velocity.textContent = velocity.toFixed(2);
    dom.period.textContent = period;
    dom.visibility.textContent = visibility;
    dom.coords.textContent = `${latLabel}, ${lngLabel}`;
  }

  function updateMapPosition(lat, lng) {
    if (!map || !issMarker) return;

    issMarker.setLngLat([lng, lat]);
    issPath.push([lng, lat]);

    if (issPath.length > MAX_PATH_POINTS) {
      issPath.shift();
    }

    const src = map.getSource("iss-path");
    if (src) {
      src.setData({
        type: "Feature",
        geometry: { type: "LineString", coordinates: issPath }
      });
    }
  }

  function scheduleNextFetch(delayMs) {
    window.clearTimeout(pollTimer);
    pollTimer = window.setTimeout(fetchISS, delayMs);
  }

  async function fetchISS() {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(ISS_API, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const lat = Number.parseFloat(data.latitude);
      const lng = Number.parseFloat(data.longitude);

      updateStats(data);
      updateMapPosition(lat, lng);

      if (firstLoad) {
        map.flyTo({ center: [lng, lat], zoom: 2.2, duration: 1200 });
        firstLoad = false;
      }

      hasLiveFix = true;
      setStatus("Live · refresh every 30s", "ok");
      dom.liveStatus.textContent = "Live feed";
      dom.liveDot.classList.add("pulse");
      scheduleNextFetch(POLL_INTERVAL_MS);
    } catch (err) {
      const limited = /429/.test(String(err));
      const message = hasLiveFix
        ? (limited ? "Rate limited · holding last fix" : "Feed delayed · holding last fix")
        : (limited ? "Rate limited · retrying slower" : "Feed delayed · retrying");

      setStatus(message, "error");
      dom.liveStatus.textContent = hasLiveFix ? "Last fix cached" : "Connecting...";
      dom.liveDot.classList.remove("pulse");
      console.error("ISS API error:", err);
      scheduleNextFetch(ERROR_RETRY_MS);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  function bootstrap() {
    initMap();
    fetchISS();
  }

  bootstrap();
})();
