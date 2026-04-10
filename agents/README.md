# Round 4 Agent Playbook

## Brief

**Mission A** — ISS Real-Time Dashboard (Captain rank)
**Mission B** — Ghost Review: Adversarial Paper Analysis (Captain rank)

## Team

| Agent | Responsabilité |
|---|---|
| Agent 1 — ISS Tracker | API position, orbital params, map integration |
| Agent 2 — Crew Data | Crew manifest validation |
| Agent 3 — Ghost Reviewer | Adversarial paper analysis, Reviewer 2 format |
| Agent 4 — Dashboard Builder | HTML/CSS/JS frontend, responsive layout |
| Agent 5 — Deploy & QA | GitHub Pages deploy autonome + checklist |

## Session 1 — Status (2026-04-10)

| Deliverable | Status |
|---|---|
| `site/index.html` | ✅ Landing hub — 2 mission cards |
| `site/iss-dashboard.html` | ✅ Live map + orbital stats + crew manifest |
| `site/ghost-review.html` | ✅ Reviewer 2 response — 3 weaknesses + minor points |
| `site/assets/styles.css` | ✅ Dark space theme, mobile responsive (900px, 560px) |
| `site/assets/iss.js` | ✅ IIFE, 2s poll, MapLibre GL, ground track, escapeHtml-free |
| `.github/workflows/deploy.yml` | ✅ GitHub Actions — site/ → Pages |
| GitHub Pages deployment | ❌ NOT STARTED — Session 2 priority |

## APIs used

- **ISS position**: `https://api.wheretheiss.at/v1/satellites/25544` → CORS ✅, HTTPS ✅, no key
- **Map tiles**: CARTO Dark (`basemaps.cartocdn.com`) → CORS ✅
- **Map library**: MapLibre GL JS 4.7.1 via unpkg CDN
- **Crew**: hardcoded (Expedition 73, verified April 2026) — no CORS-safe live API for crew

## Leçons Round 3 appliquées

- API testée CORS depuis HTTPS avant de coder (wheretheiss.at confirmé)
- `build_type: workflow` préconfiguré dans `.github/workflows/deploy.yml`
- Déploiement autonome prêt (voir Agent 5)

## Session 2 — What To Do Next

1. Git init + commit
2. Lancer deploy autonome (Agent 5)
3. QA checklist sur les URLs live
4. Soumettre les URLs au jury
