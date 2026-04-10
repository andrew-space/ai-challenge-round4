# AI Challenge Arena — Round 4

Two Captain-rank missions in a single GitHub Pages deployment.

## Missions

### Mission A — ISS Dashboard (Real-Time Tracking)
Live ISS position on a world map, current crew manifest, and live orbital parameters (altitude, velocity, orbital period).

### Mission B — Ghost Review (Adversarial Paper Analysis)
Adversarial peer review of a real published space-science abstract. 3+ genuine weaknesses, concrete improvements, formatted as a professional Reviewer 2 response.

## Project Structure

```
Round 4/
├── .github/workflows/deploy.yml
├── agents/
│   ├── README.md
│   ├── agent-1-iss-tracker.md
│   ├── agent-2-crew-data.md
│   ├── agent-3-ghost-reviewer.md
│   ├── agent-4-dashboard-builder.md
│   └── agent-5-deploy-and-qa.md
├── site/
│   ├── .nojekyll
│   ├── index.html
│   ├── iss-dashboard.html
│   ├── ghost-review.html
│   └── assets/
│       ├── styles.css
│       └── iss.js
├── .gitignore
└── README.md
```

## Judge Checklist

### Mission A — ISS Dashboard
- [ ] Dashboard live on GitHub Pages
- [ ] ISS position updates on map in real-time
- [ ] Current crew listed with nationalities
- [ ] Orbital parameters displayed (altitude, velocity, period)
- [ ] Professional and responsive design

### Mission B — Ghost Review
- [ ] Uses a real published abstract
- [ ] Identifies 3+ genuine weaknesses
- [ ] Suggestions are substantive
- [ ] Formatted as professional reviewer response
- [ ] Deployed and readable

## APIs Used

| API | URL | Purpose | CORS |
|---|---|---|---|
| Where the ISS at? | `https://api.wheretheiss.at/v1/satellites/25544` | Live lat/lng, altitude, velocity | ✅ |
| MapLibre GL JS | `https://unpkg.com/maplibre-gl` | Interactive map | CDN |
| CARTO Dark tiles | `https://basemaps.cartocdn.com` | Map tiles | ✅ |

## Local Preview

Open directly in browser:
- `site/index.html`
- `site/iss-dashboard.html`
- `site/ghost-review.html`

## Deployment

See `agents/agent-5-deploy-and-qa.md` for the full autonomous deploy process (no manual steps).
Expected URLs after deploy:
- `https://andrew-space.github.io/ai-challenge-round4/`
- `https://andrew-space.github.io/ai-challenge-round4/iss-dashboard.html`
- `https://andrew-space.github.io/ai-challenge-round4/ghost-review.html`
