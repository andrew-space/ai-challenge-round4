# Agent 4 — Dashboard Builder

## Status: ✅ Completed in Session 1

## Design System

### CSS Variables
```css
--bg: #080e1a;          /* dark navy */
--surface: #0d1526;     /* card backgrounds */
--border: #1e3056;      /* subtle borders */
--accent: #00e5ff;      /* cyan — Mission A */
--accent2: #ff4444;     /* red — Mission B */
--text: #e0e8f0;        /* primary text */
--muted: #647890;       /* secondary/labels */
```

### ISS Marker (SVG + CSS animation)
```html
<div class="iss-dot"></div>
```
```css
.iss-dot {
  width: 18px; height: 18px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 0 rgba(0, 229, 255, .6);
  animation: iss-pulse 2s ease-out infinite;
}
@keyframes iss-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(0,229,255,.6); }
  100% { box-shadow: 0 0 0 16px rgba(0,229,255,0); }
}
```

## MapLibre GL Setup

### CDN (via unpkg)
```html
<link  href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet">
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
```

### Map initialisation
```js
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [0, 0],
  zoom: 1.4,
  minZoom: 0.5,
});
```

### ISS marker element
```js
const el = document.createElement('div');
el.className = 'iss-dot';
const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
  .setLngLat([0, 0])
  .addTo(map);
```

## Layout: ISS Dashboard

```
┌─────────────────────────────────────────┐
│           ISS LIVE TRACKER topbar        │
├──────────────────────┬──────────────────┤
│                      │  ● ISS POSITION  │
│                      │  Lat / Lon cards │
│    MapLibre GL map   │  Altitude        │
│    full height       │  Velocity        │
│                      │  Orbital Period  │
│                      │  Visibility      │
│                      ├──────────────────┤
│                      │  👨‍🚀 CREW MANIFEST│
│                      │  (7× crew items) │
└──────────────────────┴──────────────────┘
```

Responsive breakpoint at 900px → stack map on top of sidebar.

## CSP Header Meta Tag (iss-dashboard.html)
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src  'self' https://unpkg.com 'unsafe-eval';
  style-src   'self' https://unpkg.com https://fonts.googleapis.com;
  font-src    https://fonts.gstatic.com https://unpkg.com data:;
  img-src     'self' data: blob: https://*.cartocdn.com;
  connect-src 'self' https://api.wheretheiss.at https://basemaps.cartocdn.com
              https://*.cartocdn.com;
  worker-src  blob:;
  object-src  'none';
  base-uri    'self';">
```

> **Note on `'unsafe-eval'`**: Required by MapLibre GL JS for WebGL shader compilation. Cannot be removed without building a custom MapLibre version. Acceptable risk for a hosted demo.

## Orbital Period Formula

$$T = 2\pi \sqrt{\frac{(R_\oplus + h)^3}{\mu}}$$

Where:
- $R_\oplus = 6371$ km (Earth mean radius)
- $h$ = altitude in km (from wheretheiss.at)
- $\mu = 398600.4418\ \text{km}^3/\text{s}^2$ (Earth standard gravitational parameter)

```js
function orbitalPeriodMin(altKm) {
  const GM = 398600.4418;
  const r  = 6371 + altKm;
  return ((2 * Math.PI * Math.sqrt(Math.pow(r, 3) / GM)) / 60).toFixed(1);
}
```

## Ghost Review Layout

Single-column, paper-like format:
- Header: journal badge + DOI link + paper title
- Abstract block (verbatim, styled as blockquote)
- Three expandable weakness cards with tags (`[MAJOR]`, `[MINOR]`)
- Suggestions section
- Final recommendation banner
