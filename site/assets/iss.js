(() => {
  "use strict";

  // ─── Config ──────────────────────────────────────────────────────────────────
  // Primary TLE source (JSON). Fallback: Celestrak plain-text.
  const TLE_PRIMARY    = "https://tle.ivanstanojevic.me/api/tle/25544";
  const TLE_FALLBACK   = "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE";
  const TLE_REFRESH_MS = 6 * 60 * 60 * 1000;   // refresh TLE every 6 h
  const POS_INTERVAL   = 2000;                  // local propagation — no API calls
  const TRACK_INTERVAL = 60_000;               // rebuild orbit track every 60 s
  const BEHIND_MIN     = 30;                    // show 30 min past orbit
  const AHEAD_MIN      = 93;                    // show ~1 full orbit ahead
  const STEP_S         = 60;                    // 1 point per minute on the track
  const R_EARTH        = 6371;
  const GM             = 398600.4418;

  const dom = {
    status:     document.getElementById("apiStatus"),
    liveStatus: document.getElementById("liveStatus"),
    liveDot:    document.getElementById("liveDot"),
    altitude:   document.getElementById("statAltitude"),
    velocity:   document.getElementById("statVelocity"),
    period:     document.getElementById("statPeriod"),
    visibility: document.getElementById("statVisibility"),
    coords:     document.getElementById("statCoords")
  };

  let map, issMarker, satrec;
  let mapLoaded = false;
  let firstFix  = true;

  // ─── Map ─────────────────────────────────────────────────────────────────────
  function emptyMLS() {
    return { type: "Feature", geometry: { type: "MultiLineString", coordinates: [] } };
  }

  function initMap() {
    map = new maplibregl.Map({
      container: "map",
      style: {
        version: 8,
        sources: { carto: {
          type: "raster",
          tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: "© CARTO © OpenStreetMap contributors"
        }},
        layers: [{ id: "carto-tiles", type: "raster", source: "carto" }]
      },
      center: [0, 20], zoom: 1.8, minZoom: 1, maxZoom: 6
    });

    map.on("load", () => {
      // Past orbit — dim solid
      map.addSource("iss-behind", { type: "geojson", data: emptyMLS() });
      map.addLayer({
        id: "iss-behind-layer", type: "line", source: "iss-behind",
        paint: { "line-color": "#00e5ff", "line-width": 1, "line-opacity": 0.22 }
      });

      // Future orbit — bright dashed
      map.addSource("iss-ahead", { type: "geojson", data: emptyMLS() });
      map.addLayer({
        id: "iss-ahead-layer", type: "line", source: "iss-ahead",
        paint: {
          "line-color": "#00e5ff",
          "line-width": 1.6,
          "line-opacity": 0.6,
          "line-dasharray": [5, 5]
        }
      });

      mapLoaded = true;
      if (satrec) updateOrbitTrack(); // TLE arrived before map loaded
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
      .setLngLat([0, 0]).addTo(map);
  }

  // ─── TLE fetch ──────────────────────────────────────────────────────────────
  async function fetchTLE() {
    // Primary: JSON API
    try {
      const r = await fetch(TLE_PRIMARY, { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      return satellite.twoline2satrec(j.line1.trim(), j.line2.trim());
    } catch { /* fall through to Celestrak */ }

    // Fallback: plain-text TLE (2 lines after name line)
    const r = await fetch(TLE_FALLBACK, { cache: "no-store" });
    if (!r.ok) throw new Error("All TLE sources failed");
    const lines = (await r.text()).split("\n").map(l => l.trim()).filter(Boolean);
    return satellite.twoline2satrec(lines[1], lines[2]);
  }

  async function loadTLE() {
    satrec = await fetchTLE();
    setStatus("Propagating from TLE", "ok");
    dom.liveStatus.textContent = "Live";
    dom.liveDot.classList.add("pulse");
    tick();
    if (mapLoaded) updateOrbitTrack();
    window.setTimeout(async () => {
      try { satrec = await fetchTLE(); updateOrbitTrack(); } catch { /* keep old satrec */ }
    }, TLE_REFRESH_MS);
  }

  // ─── Local propagation (2 s, no API) ────────────────────────────────────────
  function propagateAt(date) {
    const pv = satellite.propagate(satrec, date);
    if (!pv || !pv.position) return null;
    const gmst = satellite.gstime(date);
    const gd   = satellite.eciToGeodetic(pv.position, gmst);
    return {
      lat:    satellite.degreesLat(gd.latitude),
      lng:    satellite.degreesLong(gd.longitude),
      altKm:  gd.height,
      velKmS: Math.sqrt(pv.velocity.x ** 2 + pv.velocity.y ** 2 + pv.velocity.z ** 2),
      posEci: pv.position
    };
  }

  function tick() {
    if (!satrec) return;
    const pos = propagateAt(new Date());
    if (pos) {
      const period   = ((2 * Math.PI * Math.sqrt((R_EARTH + pos.altKm) ** 3 / GM)) / 60).toFixed(1);
      const latLabel = `${Math.abs(pos.lat).toFixed(4)}°${pos.lat >= 0 ? "N" : "S"}`;
      const lngLabel = `${Math.abs(pos.lng).toFixed(4)}°${pos.lng >= 0 ? "E" : "W"}`;

      dom.altitude.textContent   = pos.altKm.toFixed(1);
      dom.velocity.textContent   = pos.velKmS.toFixed(2);
      dom.period.textContent     = period;
      dom.coords.textContent     = `${latLabel},  ${lngLabel}`;
      dom.visibility.textContent = isSunlit(pos.posEci, new Date()) ? "Daylight" : "Eclipsed";

      issMarker.setLngLat([pos.lng, pos.lat]);
      if (firstFix) {
        map.flyTo({ center: [pos.lng, pos.lat], zoom: 2.2, duration: 1200 });
        firstFix = false;
      }
    }
    window.setTimeout(tick, POS_INTERVAL);
  }

  // ─── Orbit track (TLE-predicted, splits at antimeridian) ─────────────────────
  function splitAtAntimeridian(coords) {
    if (coords.length < 2) return coords.length ? [coords] : [];
    const segs = [];
    let cur = [coords[0]];
    for (let i = 1; i < coords.length; i++) {
      if (Math.abs(coords[i][0] - cur[cur.length - 1][0]) > 180) {
        if (cur.length >= 2) segs.push(cur);
        cur = [coords[i]];
      } else {
        cur.push(coords[i]);
      }
    }
    if (cur.length >= 2) segs.push(cur);
    return segs.length ? segs : [[]];
  }

  function setMultiLine(sourceId, segments) {
    const src = map.getSource(sourceId);
    if (src) src.setData({ type: "Feature", geometry: { type: "MultiLineString", coordinates: segments } });
  }

  function updateOrbitTrack() {
    if (!satrec || !mapLoaded) return;
    const nowMs  = Date.now();
    const behind = [], ahead = [];

    for (let t = nowMs - BEHIND_MIN * 60000; t <= nowMs; t += STEP_S * 1000) {
      const p = propagateAt(new Date(t));
      if (p) behind.push([p.lng, p.lat]);
    }
    for (let t = nowMs; t <= nowMs + AHEAD_MIN * 60000; t += STEP_S * 1000) {
      const p = propagateAt(new Date(t));
      if (p) ahead.push([p.lng, p.lat]);
    }

    setMultiLine("iss-behind", splitAtAntimeridian(behind));
    setMultiLine("iss-ahead",  splitAtAntimeridian(ahead));
    window.setTimeout(updateOrbitTrack, TRACK_INTERVAL);
  }

  // ─── Sunlit / eclipse estimation (cylindrical shadow) ───────────────────────
  function isSunlit(posEci, date) {
    const jd  = date.getTime() / 86400000 + 2440587.5;
    const T   = (jd - 2451545) / 36525;
    const Ls  = (280.460 + 36000.771 * T) % 360;
    const Ms  = (357.528 + 35999.050 * T) % 360;
    const lam = (Ls + 1.915 * Math.sin(Ms * Math.PI / 180) + 0.020 * Math.sin(Ms * 2 * Math.PI / 180)) * Math.PI / 180;
    const eps = 23.440 * Math.PI / 180;
    const sx  = Math.cos(lam), sy = Math.sin(lam) * Math.cos(eps), sz = Math.sin(lam) * Math.sin(eps);
    const dot = posEci.x * sx + posEci.y * sy + posEci.z * sz;
    if (dot > 0) return true;
    const perp2 = posEci.x ** 2 + posEci.y ** 2 + posEci.z ** 2 - dot ** 2;
    return perp2 > R_EARTH ** 2;
  }

  // ─── Status helper ───────────────────────────────────────────────────────────
  function setStatus(text, mode) {
    dom.status.textContent = text;
    dom.status.className = "status-dot" + (mode ? ` status-dot--${mode}` : "");
  }

  // ─── Bootstrap ───────────────────────────────────────────────────────────────
  async function bootstrap() {
    initMap();
    setStatus("Loading TLE…", null);
    try {
      await loadTLE();
    } catch (err) {
      setStatus("TLE unavailable", "error");
      dom.liveStatus.textContent = "Offline";
      dom.liveDot.classList.remove("pulse");
      console.error("Bootstrap error:", err);
    }
  }

  bootstrap();
})();
