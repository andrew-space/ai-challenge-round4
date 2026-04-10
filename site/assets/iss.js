(() => {
  "use strict";

  const ISS_API = "https://api.wheretheiss.at/v1/satellites/25544";
  const POLL_INTERVAL_MS = 2000;

  // Earth radius and gravitational parameter for orbital period calculation
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
  const MAX_PATH_POINTS = 120; // ~4 min of ground track

  // ─── Map Setup ─────────────────────────────────────────────────────────────
  function initMap() {
    map = new maplibregl.Map({
      container: "map",
      style: {
        version: 8,
        sources: {
          carto: {
            type: "raster",
            tiles: [
              "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
            ],
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
      // Ground track line source
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

    // ISS marker element
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

  // ─── Orbital Period Calculation ────────────────────────────────────────────
  function calcOrbitalPeriodMin(altitudeKm) {
    const r = R_EARTH_KM + altitudeKm;
    const tSec = 2 * Math.PI * Math.sqrt(Math.pow(r, 3) / GM_KM3_S2);
    return (tSec / 60).toFixed(1);
  }

  // ─── UI Updates ────────────────────────────────────────────────────────────
  function setStatus(text, mode) {
    dom.status.textContent = text;
    dom.status.className = "status-dot" + (mode ? ` status-dot--${mode}` : "");
  }

  function updateStats(data) {
    const alt = parseFloat(data.altitude).toFixed(1);
    const vel = parseFloat(data.velocity).toFixed(2);
    const period = calcOrbitalPeriodMin(parseFloat(data.altitude));
    const vis = data.visibility === "daylight" ? "☀ Daylight" : "🌑 Eclipsed";
    const lat = parseFloat(data.latitude).toFixed(4);
    const lng = parseFloat(data.longitude).toFixed(4);
    const latLabel = lat >= 0 ? `${lat}°N` : `${Math.abs(lat)}°S`;
    const lngLabel = lng >= 0 ? `${lng}°E` : `${Math.abs(lng)}°W`;

    dom.altitude.textContent = alt;
    dom.velocity.textContent = vel;
    dom.period.textContent = period;
    dom.visibility.textContent = vis;
    dom.coords.textContent = `${latLabel}, ${lngLabel}`;
  }

  function updateMapPosition(lat, lng) {
    if (!map || !issMarker) return;

    issMarker.setLngLat([lng, lat]);

    // Append to ground track
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

  // ─── Data Fetch ────────────────────────────────────────────────────────────
  let firstLoad = true;

  async function fetchISS() {
    try {
      const response = await fetch(ISS_API, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store"
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const lat = parseFloat(data.latitude);
      const lng = parseFloat(data.longitude);

      updateStats(data);
      updateMapPosition(lat, lng);

      if (firstLoad) {
        map.flyTo({ center: [lng, lat], zoom: 2.2, duration: 1200 });
        firstLoad = false;
      }

      setStatus("Live · updating every 2s", "ok");
      dom.liveStatus.textContent = "LIVE";
      dom.liveDot.classList.add("pulse");
    } catch (err) {
      setStatus("Feed error — retrying", "error");
      dom.liveStatus.textContent = "Reconnecting...";
      dom.liveDot.classList.remove("pulse");
      console.error("ISS API error:", err);
    }
  }

  // ─── Bootstrap ─────────────────────────────────────────────────────────────
  function bootstrap() {
    initMap();
    fetchISS();
    window.setInterval(fetchISS, POLL_INTERVAL_MS);
  }

  bootstrap();
})();
