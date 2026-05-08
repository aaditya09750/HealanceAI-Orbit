# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `ML Services02/` — FastAPI inference service with `app.py`, extracted `heart_diabetes_predict.py` / `symptom_disease_predict.py`, model artifacts, and dual `requirements.txt` / `requirements-dev.txt` (strict prod pins vs. looser dev pins).
- `render.yaml` Blueprint defining both Render web services (Node backend + Python ML).
- `Frontend/vercel.json` for SPA rewrites and security headers (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`).
- `docs/ADRs/0005-ml-http-service.md` — supersedes ADR-0004; documents the move from Python subprocess to HTTP service.
- **Cold-start mitigation layer** for Render free-tier dynos:
  - `Frontend/src/lib/wakeProductionServices.js` — fires `GET /health` to both Render services on every production page load (gated on `import.meta.env.PROD`).
  - `<link rel="preconnect">` + `dns-prefetch` hints in `Frontend/index.html` for both Render domains.
  - `CORSMiddleware` on `ML Services02/app.py` allowing the Vercel production origin so the browser-side wake fetch is observable (no `no-cors` workaround).
  - `GET /api/predict/warmup` route + `warmupMlService()` helper in `Backend/utils/mlPredictor.js` for per-feature pre-warm from authenticated UIs.
  - Auto-retry, HTML-response detection, and structured `ML_WARMING` error code in `Backend/utils/mlPredictor.js`. Configurable via new env vars `ML_RETRY_COUNT` (default 1) and `ML_RETRY_DELAY_MS` (default 2000).
  - Heart & Diabetes prediction page now calls `riskService.warmupMl()` on mount, shows progressive loading phases ("Analyzing..." → "Warming up..." → "Almost there..."), and translates transient ML errors into a friendly retry message instead of leaking Render's HTML 502 page.
- Root `ARCHITECTURE.md` with system-context, container, ERD, and primary-workflow sequence diagrams.
- `docs/API.md` exhaustively documenting every HTTP endpoint exposed by the backend.
- `docs/SETUP.md` with local-dev walkthrough and per-integration setup (OpenAI, Groq, Twilio, WhatsApp Cloud API, Gmail SMTP, public NIH/FDA/OSM/Open-Meteo APIs).
- `docs/ADRs/` with architectural decision records: sibling-app layout, no shared-schemas package, JWT cookie auth, ML subprocess bridge (now superseded), ML HTTP service.
- `.github/PULL_REQUEST_TEMPLATE.md` and `.github/ISSUE_TEMPLATE/` (bug, feature, config) to standardize contributions.
- `.gitattributes` for line-ending normalization and binary markers.
- `CHANGELOG.md` (this file).

### Changed

- `Backend/utils/mlPredictor.js` rewritten to call the ML service over HTTP instead of spawning Python — same exports, no controller changes required.
- `Backend/utils/generateToken.js` switches cookies to `SameSite=None; Secure` in production for cross-domain Vercel↔Render auth (`Lax` retained for local dev).
- `Backend/config/db.js` adds `maxPoolSize: 10`, `serverSelectionTimeoutMS: 5000`, `socketTimeoutMS: 45000` for managed-Atlas resilience.
- `Backend/server.js` `/api/health` now returns 503 when MongoDB is disconnected; removed the `/uploads` static handler (Cloudinary is canonical and Render disk is ephemeral).
- `Backend/package.json` pins `engines.node: ">=18.18.0 <21"`.
- `Backend/controllers/forecastController.js` adds explicit logging, `AbortController` timeouts, and a `User-Agent` header on weather provider fetches; `WEATHER_FETCH_TIMEOUT_MS` env knob (default 20s).
- `Backend/utils/mlPredictor.js` default `ML_TIMEOUT_MS` raised from 25000 ms → 45000 ms to accommodate Render free-tier cold starts.
- `Frontend/src/{website/pages/ContactPage,dashboard/components/Sidebar,dashboard/pages/Profile}.jsx` consolidated to import `API_URL` from `Frontend/src/constants/config.js` instead of re-reading `import.meta.env.VITE_API_URL`.
- Documentation: `docs/ARCHITECTURE.md`, `docs/SETUP.md`, `docs/env-setup.md`, root `README.md`, `Backend/README.md`, and `CLAUDE.md` updated to reflect HTTP-based ML and live deployment URLs.

### Removed

- `Frontend/netlify.toml` (replaced by `Frontend/vercel.json`).
- Backend env var `PYTHON_BIN` (no longer used; ML is reached over HTTP).

[Unreleased]: https://github.com/aaditya09750/HealanceAI-Orbit/compare/HEAD...HEAD
