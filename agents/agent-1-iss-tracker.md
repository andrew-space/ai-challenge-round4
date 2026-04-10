# Agent 1 — ISS Tracker

## Status: ✅ Implemented in Session 1

## API: Where the ISS at?

- **Endpoint**: `https://api.wheretheiss.at/v1/satellites/25544`
- **CORS**: ✅ `Access-Control-Allow-Origin: *`
- **HTTPS**: ✅
- **Auth**: None required
- **Rate limit**: ~1 req/sec safe — polling at 2s intervals

## Response fields used

```json
{
  "latitude":   -17.4512,
  "longitude":  142.3012,
  "altitude":   418.42,     // km
  "velocity":   7.66,       // km/s
  "visibility": "daylight"  // or "eclipsed"
}
```

## Orbital Period Calculation (in iss.js)

```js
// Kepler's third law: T = 2π × √(r³ / GM)
const R_EARTH_KM = 6371;
const GM_KM3_S2  = 398600.4418;
const r = R_EARTH_KM + altitude;
const T_sec = 2 * Math.PI * Math.sqrt(Math.pow(r, 3) / GM_KM3_S2);
const T_min = T_sec / 60; // ≈ 92 min for ISS
```

## Ground Track

Last 120 position points stored in `issPath[]` and rendered as a dashed cyan line on the map.
At 2s polling = ~4 minutes of track visible.

## Known limits

- `wheretheiss.at` can occasionally be slow (1–2s latency) — graceful error state implemented
- Position has ~2s lag from real ISS due to TLE propagation
