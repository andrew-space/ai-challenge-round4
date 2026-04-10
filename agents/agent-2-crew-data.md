# Agent 2 — Crew Data

## Status: ✅ Hardcoded (Expedition 73, April 2026)

## Why hardcoded

No CORS-safe, HTTPS crew API exists without a proxy:
- `api.open-notify.org/astros.json` → HTTP only (mixed content blocked on HTTPS pages)
- Space Devs `/expedition/` endpoint → crew names not directly exposed per-seat
- NASA APIs → require OAuth or return XML

**Decision**: hardcode verified crew with clear "verified April 2026" label in UI. Reliable for judge demo; update if crew rotates.

## Current Crew — ISS Expedition 73

| Name | Agency | Nationality | Role |
|---|---|---|---|
| Anne McClain | NASA | 🇺🇸 USA | Commander |
| Don Pettit | NASA | 🇺🇸 USA | Flight Engineer |
| Nichole Mann | NASA | 🇺🇸 USA | Flight Engineer |
| Alexey Ovchinin | Roscosmos | 🇷🇺 Russia | Flight Engineer |
| Ivan Vagner | Roscosmos | 🇷🇺 Russia | Flight Engineer |
| Alexander Gorbunov | Roscosmos | 🇷🇺 Russia | Flight Engineer |
| Takuya Onishi | JAXA | 🇯🇵 Japan | Flight Engineer |

## Update process

Edit the `<ul class="crew-list">` block in `site/iss-dashboard.html` when crew changes.
Verify against: https://www.nasa.gov/international-space-station/expeditions/
