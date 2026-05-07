# Architecture

This document describes the current runtime architecture and request/data flow of Healance AI Orbit.

## 1. System Context

The platform is a multi-tier application:
- Frontend SPA (`Frontend/`) for public pages and authenticated dashboard experiences
- Backend API (`Backend/`) for auth, business logic, persistence, and integrations
- Python ML inference service (`ML Services02/`, FastAPI) reached over HTTP
- Legacy `ML Services/` retained for training scripts, datasets, and model artifacts (not invoked at runtime)

The backend talks to the ML service over HTTP. There is no in-process Python.

## 2. Backend Architecture

## 2.1 Bootstrap Pipeline

`Backend/server.js`:
1. Loads environment variables
2. Connects to MongoDB
3. Applies security middleware (`helmet`, CORS, rate limits)
4. Applies JSON/urlencoded parsers and cookies
5. Mounts feature routes under `/api/*`
6. Applies 404 and centralized error handlers

## 2.2 Layering

- Routes: `Backend/routes/*.js`
- Controllers: `Backend/controllers/*.js`
- Models: `Backend/models/*.js`
- Middleware: auth, error handling, upload constraints
- Utilities: API clients, predictor bridge, analyzers, token helpers

This is a conventional Express modular layering approach.

## 2.3 Auth and Session Model

- Access and refresh tokens are cookie-supported
- `protect` middleware validates token and resolves `req.user`
- Protected routes use route-level middleware composition

Frontend also retains a minimal localStorage user snapshot for UX continuity while backend cookies remain source of truth.

## 2.4 Feature Domains

Primary route groups:
- `auth`, `users`
- `health-data`, `goals`, `walk-earn`
- `predict` (heart/diabetes/symptom workflows)
- `dashboard` (summary/trends/insights)
- `chatbot` (messageing, medicine enrichment, report analysis, nearby doctors)
- `forecast`, `blogs`, `contact`, `notifications`

## 3. ML Integration Architecture

## 3.1 Bridge

`Backend/utils/mlPredictor.js` calls the ML service over HTTP via the built-in `fetch`. It reads `ML_SERVICE_URL` and `ML_SERVICE_TOKEN` from env and routes by script-path basename so existing controller call sites do not change.

Contracts:
- Backend POSTs a JSON payload (with `X-ML-Service-Token` header) to one of the ML endpoints
- ML service returns a single JSON object
- Non-2xx response or invalid JSON is treated as prediction failure
- Configurable timeout (`ML_TIMEOUT_MS`, default 25 s) protects the request path

## 3.2 ML Service

`ML Services02/app.py` (FastAPI) loads model artifacts once at startup and exposes:
- `GET /health` — readiness probe (returns `models_loaded` flag)
- `POST /predict/heart-diabetes` — `{modelType, features}` for diabetes/heart classification
- `POST /predict/symptom-disease` — `{features?, context?, symptoms?}` for symptom-to-disease prediction with top-K alternatives and structured details

Inference helpers live alongside the entrypoint:
- `ML Services02/heart_diabetes_predict.py` (joblib bundles, lazy-loaded)
- `ML Services02/symptom_disease_predict.py` (44 MB pickle, loaded once at lifespan startup)
- `ML Services02/models/` — `.joblib` and `.pkl` artifacts

## 3.3 Training pipeline (out of band)

Model training scripts and datasets remain in the original `ML Services/` directory and are not part of the runtime path. To retrain, run the relevant `train_*.py` there and copy the regenerated artifact into `ML Services02/models/`.

## 4. Frontend Architecture

## 4.1 Composition

- `main.jsx`: app mount
- `App.jsx`: route tree and lazy-loaded pages
- `context/`: auth, health data, toast state providers
- `services/api.js`: Axios instance + domain service wrappers
- `dashboard/`: authenticated feature pages and components
- `website/`: marketing/public routes
- `shared/`: reusable UI and cross-domain components

## 4.2 API Communication

The axios client is configured with:
- `withCredentials: true`
- auth refresh retry on 401 for non-auth endpoints
- bounded retry for 429 rate limiting

This keeps session continuity and reduces transient auth/rate-limit failures.

## 5. Persistence Model

MongoDB + Mongoose supports:
- identity/account (`User`, otp models)
- health telemetry (`HealthData`, `Goal`, `WalkEarn`)
- prediction history (`RiskPrediction`, `SymptomPrediction`)
- conversational/chat artifacts (`ChatSession`, reports)
- content/support (`Blog`, `Contact`, `Notification`, `Doctor`)

## 6. External Integration Surface

Backend utilities integrate with:
- OpenAI (chat and dashboard insight generation)
- Groq (report analysis)
- openFDA + RxNav (medicine enrichment)
- OpenStreetMap Overpass + geocoding providers (nearby doctor discovery)
- Twilio/WhatsApp/email providers for communication flows

## 7. Operational Concerns

- Security middleware enabled (headers, rate limiting, CORS)
- Uploaded files served via backend static mount
- Build path is frontend Vite `dist/`
- Known large chunks in frontend build output; tracked as optimization opportunity, not a runtime error

## 8. Standards and Tooling Baseline

Repository-level standards:
- `.editorconfig`
- `.prettierrc.json`
- `.prettierignore`
- root `.gitignore` hardened for node/python artifacts

Tier-level standards:
- `Backend/eslint.config.js`
- `Frontend/eslint.config.js`
- lint/format scripts in each tier package manifest

CI baseline:
- `.github/workflows/ci.yml` runs backend/frontend lint and frontend build

## 9. Change Safety Guidance

When making updates:
- maintain API response compatibility
- keep ML payload contracts stable unless coordinated
- avoid renaming historical directories or model artifacts without migration
- keep auth token/cookie behavior backward-compatible
