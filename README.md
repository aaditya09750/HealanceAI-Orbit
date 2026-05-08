# Healance AI - Health & Wellness Platform

![React](https://img.shields.io/badge/React-19.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-FFB300?style=for-the-badge&logo=jsonwebtokens&logoColor=black)
![openFDA](https://img.shields.io/badge/openFDA-API-0A66C2?style=for-the-badge)
![Groq](https://img.shields.io/badge/Groq-LLM-F55036?style=for-the-badge)
![RxNav](https://img.shields.io/badge/RxNav-NIH-1E6091?style=for-the-badge)
![OpenStreetMap](https://img.shields.io/badge/OpenStreetMap-Overpass-7EBC6F?style=for-the-badge&logo=openstreetmap&logoColor=white)

A comprehensive full-stack health and wellness platform with AI-powered features.

**Authors:** Aaditya Gunjal (Full Stack Developer...)

---

## Core Features

- **AI-Powered Health Assistants:** Health Assistant Bot for symptoms, diet, exercise, and wellness guidance.
- **AI Personal Health Assistant:** Upload medical reports (PDF/DOCX) for structured AI analysis (key findings, flags, suggested medications, suggested specialists), medicine explanations with drug-drug interaction checks against user medications, and nearby specialist lookup via seeded doctors + OpenStreetMap.
- **Medicine Information Bot:** Real-time FDA-approved drug details using openFDA API, including dosage, warnings, side effects, interactions, and more.
- **Health Dashboard:** Animated Health Score hero (composite of steps, water, goals, prediction recency) with streak counter and rule-based Next Action, AI-generated Smart Insights (LLM with rule-based fallback), real 7/30-day Weekly Health Trends chart, live Today's Focus panel driven from goals, unified Recent Activity timeline (dedupes symptom history), Quick Actions bar, and fully responsive layout from 375px mobile to desktop.
- **Goal Tracking & Achievements:** Personalized goals (weight, steps, calories, water), daily progress, badges, and reverse planning.
- **Walk & Earn Rewards:** Convert steps into points, unlock rewards, and join challenges.
- **3D Body Explorer:** Interactive 3D anatomy model with 34 body parts across 12 systems, functional system filter panel (Cardiovascular, Respiratory, Digestive, Nervous, Musculoskeletal) with locked 224px panel width, subtle emissive glow on active-system regions (neutral body preserved), in-panel parts list, client-side fuzzy search (`/` shortcut), and condition/ICD-10 level details.
- **Health Forecast:** Weather-based recommendations with air-quality and pollen awareness.
- **Risk & Disease Prediction:** **Heart** and diabetes risk prediction with gradient result cards and animated BMI indicator; symptom-based disease prediction with adaptive follow-up questions, LLM refinement, top-K alternatives with "Why this?" reasoning, and structured recommendations (description, precautions, medications, diet, workout, risk factors).
- **Unified Prediction History:** Tabbed (All / Symptoms / Heart & Diabetes) history timeline with icon-differentiated rows, dedupes consecutive identical symptom entries, tone-mapped risk badges (info/warn/critical), and PDF export covering both report types.
- **Health Blog & News:** Curated wellness content with search/filter support.
- **Secure Authentication:** JWT auth, password reset by email, social login, and role-based access.

---

## Technology Stack

| Technology | Version | Purpose |
| ---------- | ------- | ------- |
| React | 19.1.x | Frontend framework |
| Vite | 6.3.x | Frontend build tooling |
| React Router DOM | 7.13.x | Client-side routing |
| Tailwind CSS | 3.4.x | Styling |
| Framer Motion | 12.x | Animations |
| GSAP | 3.14.x | Motion timeline effects |
| Lucide React | 0.511.x | Icon system |
| Recharts | 3.7.x | Dashboard charts |
| Three.js + React Three Fiber | 0.183.x + 9.5.x | 3D body explorer |
| Axios | 1.9.x | HTTP requests |
| Node.js | 18+ | Backend runtime |
| Express | 4.21.x | Backend framework |
| MongoDB | 8.x | Database |
| Mongoose | 8.x | ODM for MongoDB |
| JWT | 9.x | Authentication |
| bcryptjs | 2.4.x | Password hashing |
| Multer | 1.4.x | File upload |
| Nodemailer | 8.0.x | Email service |
| Twilio | 5.5.x | SMS/WhatsApp OTP |
| Groq (Llama 3.3 70B) | via `openai` SDK | Report analysis LLM (free tier) |
| OpenAI GPT-3.5-turbo | via `openai` SDK | Dashboard Smart Insights generator (15-min in-memory cache, rule-based fallback) |
| pdf-parse | 2.4.x | PDF text extraction for report analysis |
| mammoth | 1.12.x | DOCX text extraction for report analysis |
| openFDA | Public API | Drug label data (keyless) |
| NIH RxNav | Public API | Drug normalization, class, and interaction matching (keyless) |
| OpenStreetMap Overpass | Public API | Nearby hospitals/clinics lookup (keyless) |
| Open-Meteo Geocoding | Public API | City -> lat/lon for specialist search (keyless) |
| Python | 3.11+ recommended | ML services runtime |
| scikit-learn | 1.6.x | ML model training/inference |

---

## Project Structure

```text
healance_ai_health_platform/
+-- Backend/
|   +-- config/
|   |   +-- db.js
|   +-- controllers/
|   |   +-- authController.js
|   |   +-- chatbotController.js
|   |   +-- predictController.js
|   |   +-- riskController.js
|   |   +-- healthController.js
|   |   +-- dashboardController.js    (summary, trends, insights)
|   |   +-- bodyExplorerController.js (34 parts / 12 systems)
|   |   +-- ...
|   +-- middleware/
|   +-- models/
|   |   +-- User.js
|   |   +-- HealthData.js
|   |   +-- MedicalReport.js
|   |   +-- ChatSession.js
|   |   +-- Doctor.js
|   |   +-- ...
|   +-- routes/
|   |   +-- authRoutes.js
|   |   +-- healthRoutes.js
|   |   +-- predictRoutes.js
|   |   +-- riskRoutes.js
|   |   +-- chatbotRoutes.js
|   |   +-- dashboardRoutes.js
|   |   +-- bodyExplorerRoutes.js
|   |   +-- ...
|   +-- seeds/
|   |   +-- seedData.js
|   |   +-- seedDoctors.js
|   +-- tests/
|   +-- utils/
|   |   +-- fdaApi.js
|   |   +-- fdaTextCleaner.js
|   |   +-- textExtractor.js
|   |   +-- reportAnalyzer.js
|   |   +-- groqClient.js
|   |   +-- rxNavApi.js
|   |   +-- osmOverpass.js
|   |   +-- geocode.js
|   |   +-- mlPredictor.js
|   |   +-- sendEmail.js
|   |   +-- sendSms.js
|   |   +-- sendWhatsApp.js
|   |   +-- generateToken.js
|   +-- .env.example
|   +-- .env
|   +-- package.json
|   +-- server.js
|
+-- Frontend/
|   +-- src/
|   |   +-- website/
|   |   |   +-- components/
|   |   |   +-- pages/
|   |   +-- dashboard/
|   |   |   +-- components/
|   |   |   |   +-- dashboard/
|   |   |   |   |   +-- HealthScoreHero.jsx        (circular gauge + streak + Next Action)
|   |   |   |   |   +-- QuickActionsBar.jsx        (Symptoms / Walk / Goal pills)
|   |   |   |   |   +-- WeeklyTrendsChart.jsx      (multi-series area, 7d/30d toggle)
|   |   |   |   |   +-- TodayFocusCard.jsx         (live goals with gradient progress)
|   |   |   |   |   +-- SmartInsightsCard.jsx      (LLM + rule-based insights)
|   |   |   |   |   +-- RecentPredictionsCard.jsx  (unified tabbed history)
|   |   |   |   +-- body-explorer/
|   |   |   |   |   +-- LayerPanel.jsx             (224 px fixed system filter)
|   |   |   |   |   +-- AnatomyViewer.jsx
|   |   |   |   |   +-- AnatomyModel.jsx
|   |   |   |   |   +-- PartSearchBar.jsx
|   |   |   |   |   +-- bodyGeometry.js            (SYSTEM_META, palettes, accents)
|   |   |   +-- pages/
|   |   |   |   +-- Dashboard.jsx
|   |   |   |   +-- RiskPrediction.jsx
|   |   |   |   +-- HeartDiabetesPrediction.jsx
|   |   |   |   +-- AIChatbots.jsx
|   |   |   |   +-- BodyExplorer.jsx
|   |   |   |   +-- ReversePlanner.jsx
|   |   |   |   +-- Forecast.jsx
|   |   |   |   +-- DashboardBlogs.jsx
|   |   |   |   +-- DashboardContact.jsx
|   |   |   |   +-- Profile.jsx
|   |   |   |   +-- PredictionHistory.jsx
|   |   |   |   +-- chatbot/
|   |   |   |   |   +-- MessageDispatcher.jsx
|   |   |   |   |   +-- ReportSummaryCard.jsx
|   |   |   |   |   +-- MedicineCard.jsx
|   |   |   |   |   +-- DoctorCard.jsx
|   |   |   |   |   +-- DoctorGrid.jsx
|   |   |   |   |   +-- LocationPermissionModal.jsx
|   |   +-- context/
|   |   +-- hooks/
|   |   +-- shared/
|   |   |   +-- ui/
|   |   |   |   +-- CircularGauge.jsx       (SVG ring with gradient stroke + count-up)
|   |   |   |   +-- Sparkline.jsx           (7-point SVG trend with gradient fill)
|   |   |   |   +-- useCountUp.js           (animated number transitions hook)
|   |   |   |   +-- Skeleton.jsx            (SkeletonHero, SkeletonQuickActions, etc.)
|   |   |   |   +-- EmptyState.jsx
|   |   |   |   +-- DashReveal.jsx
|   |   +-- services/
|   |   |   +-- api.js                      (dashboardService: getSummary, getTrends, getInsights)
|   |   +-- constants/
|   |   +-- App.jsx
|   |   +-- main.jsx
|   +-- .env
|   +-- package.json
|   +-- netlify.toml
|
+-- ML Services/
|   +-- Heart&diabeties/
|   |   +-- train_models.py
|   |   +-- predict.py
|   |   +-- requirements.txt
|   |   +-- models/
|   +-- Symtums_diseas/
|   |   +-- train_symptom_model.py
|   |   +-- predict_symptom_disease.py
|   |   +-- requirements.txt
|   |   +-- models/
|
+-- .gitignore
+-- README.md
```

---

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (8.0+ local or Atlas)
- Python (3.11 or 3.12 recommended for ML services)
- Git
- npm

### Backend Setup

```bash
cd Backend
npm install
cp .env.example .env
# Update .env values, then run:
npm run dev
# Backend: http://localhost:5000
```

Windows alternative:

```powershell
copy .env.example .env
```

**Backend `.env` example:**

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/healance_ai
JWT_SECRET=your_super_secret_jwt_key_here_change_this
JWT_EXPIRE=15m
CLIENT_URL=http://localhost:5173

# Optional
OPENAI_API_KEY=your_openai_key
GROQ_API_KEY=your_groq_key           # free tier from console.groq.com/keys — powers report analysis
GEMINI_API_KEY=                      # optional fallback LLM (aistudio.google.com/app/apikey)
WEATHER_API_KEY=your_openweathermap_key
OPENWEATHER_API_KEY=
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_PHONE_NUMBER_ID=your-whatsapp-phone-number-id
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+12345678900

# Cloudinary (file uploads — medical reports, avatars, ticket attachments)
CLOUDINARY_URL=cloudinary://your_api_key:your_api_secret@your_cloud_name
```

### Frontend Setup

```bash
cd Frontend
npm install
# Create .env file manually (Frontend/.env.example is not present)
# Set API URL:
# VITE_API_URL=http://localhost:5000/api
npm run dev
# Frontend: http://localhost:5173
```

**Frontend `.env` example:**

```env
VITE_API_URL=http://localhost:5000/api
```

Note: frontend code fallback points to `http://localhost:5001/api` if `VITE_API_URL` is not set, so keep `Frontend/.env` explicit to avoid port mismatch.

### ML Services Setup (Python)

```bash
# Heart & Diabetes ML service
cd "ML Services/Heart&diabeties"
pip install -r requirements.txt

# Symptom-to-Disease ML service
cd "../Symtums_diseas"
pip install -r requirements.txt
```

Train models only when you need to regenerate artifacts:

Inference now runs as a separate FastAPI service in `ML Services02/` (see [ADR-0005](docs/ADRs/0005-ml-http-service.md)). For local dev:

```bash
cd "ML Services02"
pip install -r requirements-dev.txt
uvicorn app:app --port 8001
```

Then set in `Backend/.env`:

```env
ML_SERVICE_URL=http://localhost:8001
ML_SERVICE_TOKEN=
```

The legacy `ML Services/` directory still holds training scripts and datasets. To retrain a model, run the relevant `train_*.py` there and copy the regenerated artifact into `ML Services02/models/`.

```bash
cd "ML Services/Heart&diabeties"
python train_models.py

cd "../Symtums_diseas"
python train_symptom_model.py
```

### Optional Seed Data

```bash
cd Backend
npm run seed
```

Creates demo users, blog posts, rewards, and sample health goals.

---

## Usage Flow

1. **Register/Login** - Create account and authenticate.
2. **Dashboard** - View health stats, trends, and progress.
3. **Use AI Assistants** - Ask wellness questions or search medicines.
4. **Set Goals** - Add goals and track daily progress.
5. **Walk & Earn** - Record steps and redeem rewards.
6. **Track Insights** - Use forecast, anatomy explorer, and blog resources.

---

## Demo Credentials

| Email | Password | Role |
| ----- | -------- | ---- |
| demo@healance.ai | demo123456 | User |
| admin@healance.ai | admin123456 | Admin |

---

## UI & Design

- Clean and modern Tailwind CSS based interface
- Responsive layout for desktop, tablet, and mobile (tested down to 375 px)
- Smooth animation with Framer Motion + GSAP
- Reusable component-driven frontend architecture
- Focused, health-centric UX across modules

### Design system extensions

The `.dash-*` utility family in `Frontend/src/index.css` was extended with:

- `.dash-card-hero` - 20 px radius card with indigo -> white -> rose gradient background and glow blobs, used for Health Score hero
- `.dash-card-accent` - per-section 3 px colored left stripe (`--accent-stripe`) so each card reads as a distinct zone
- `.dash-card-glow` - re-enabled hover lift (`translateY(-3px)` + accent-ring shadow) for interactive cards
- `.dash-gradient-text` - indigo -> cyan background-clip text used for hero score and section titles
- `.dash-icon-badge--gradient-{indigo|rose|emerald|amber|cyan|violet}` - 6 gradient icon-badge variants with color-matched lifted shadow
- `.dash-chip`, `.dash-chip--ai` - pill badges used by Smart Insights header

### Shared UI primitives

- `CircularGauge` (SVG ring with animated gradient stroke + count-up) - used by Health Score hero and Risk Prediction confidence display
- `Sparkline` (7-point inline SVG with gradient fill) - used by the Daily Steps stat card
- `useCountUp` hook - tweens numbers from previous value over 800 ms on any change (Hero score, streak, goal %)
- `SkeletonHero` / `SkeletonQuickActions` added to `Skeleton.jsx`

### Page-by-page polish (every dashboard page)

Every dashboard route now uses the extended design system consistently:

- `Dashboard.jsx` - Hero -> Quick Actions -> enhanced stat row -> Weekly Trends + Today's Focus -> Latest Symptoms + Smart Insights -> Recent Activity
- `RiskPrediction.jsx` - gradient-text title, `CircularGauge` on result hero, gradient icon badges on all 6 detail cards
- `HeartDiabetesPrediction.jsx` - gradient-tinted risk result cards (rose for elevated, emerald for safe), gradient BMI panel, accent-stripe suggestions card
- `AIChatbots.jsx` - gradient tab indicators (indigo for health, rose for medicine), gradient typing avatar
- `ReversePlanner.jsx` - 6-color gradient progress bars per goal type, gradient bar chart, priority-tinted AI suggestions
- `Forecast.jsx` - gradient pill for active city, gradient "today" day cell, gradient icon badges on all section headers, gradient numbered health tips
- `DashboardBlogs.jsx` - `.dash-card-glow` blog cards, gradient category badges, amber "Trending" ribbon, brand-gradient Saved Articles CTA
- `DashboardContact.jsx` - color-coded gradient icon badges (indigo email / emerald phone / amber hours), gradient hover on upload dropzone
- `Profile.jsx` - avatar wrapped in gradient ring frame, glass gradient background on profile-photo panel
- `PredictionHistory.jsx` - gradient tone badges, icon-prefixed history list rows, pill-toggle tabs with gradient icons

---

## Security Features

- JWT authentication with HTTP-only cookies
- Password hashing with bcrypt
- Role-based route protection
- Password reset token flow
- CORS, Helmet, and rate limiting protections
- Input validation on API routes

---

## API Endpoints

### Base URL

```text
http://localhost:5000/api
```

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)
- `POST /api/auth/logout` - Logout (Protected)
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password/:token` - Reset password
- `PUT /api/auth/update-password` - Update password (Protected)

### Chatbot

- `POST /api/chatbot/message` - Send message to bot (Protected)
- `GET /api/chatbot/sessions` - Get chat sessions (Protected)
- `GET /api/chatbot/sessions/:id` - Get messages by session (Protected)
- `DELETE /api/chatbot/sessions/:id` - Delete session (Protected)
- `POST /api/chatbot/analyze-report/:reportId` - AI analysis of an uploaded PDF/DOCX report (Protected)
- `POST /api/chatbot/explain-medicine` - FDA + RxNav drug info with interaction check vs user meds (Protected)
- `POST /api/chatbot/nearby-doctors` - Nearby specialists from seeded DB + OSM Overpass (Protected)
- `POST /api/chatbot/geocode` - Resolve a city name to lat/lon via Open-Meteo (Protected)

### Health Data

- `POST /api/health-data` - Add health record (Protected)
- `GET /api/health-data/today` - Get today health record (Protected)
- `GET /api/health-data/dashboard` - Get dashboard summary (Protected)

### Dashboard

- `GET /api/dashboard/summary` - Composite health score, streak, today totals, next-action rule (Protected)
- `GET /api/dashboard/trends?range=7d|30d` - Per-day stepsPct/waterPct/goalsPct/healthScore series (Protected)
- `GET /api/dashboard/insights` - LLM-generated insights with 15-min per-user cache + rule-based fallback (Protected)

### Additional Modules

- Goals: `/api/goals`
- Walk & Earn: `/api/walk-earn`
- Risk Analysis: `/api/risk-prediction`
- ML Predictions: `/api/predict`
- Blogs: `/api/blogs`
- Forecast: `/api/forecast`
- Contact: `/api/contact`
- Notifications: `/api/notifications`
- Body Explorer (Public): `/api/body-explorer` - 34 parts, 12 systems, `?search=` / `?system=` / `?gender=` filters, `/meta/systems` for filter UI
- SMS OTP: `/api/sms`
- WhatsApp OTP: `/api/whatsapp`

Full API details: [Backend README](./Backend/README.md)

---

## Medicine Information Bot

The Medicine Info Bot integrates with the FDA openFDA API to return real-time, FDA-approved medicine information.

**Supported fields include:**

- Brand and generic names
- Purpose and usage
- Active ingredients
- Dosage and administration
- Warnings and precautions
- Side effects and interactions
- Contraindications
- Manufacturer details

**Quick test:**

```bash
node Backend/tests/testFdaApi.js --detailed aspirin
```

Detailed API docs: [Backend README](./Backend/README.md)

---

## Dashboard Experience

The main dashboard at `/dashboard` was rebuilt top-to-bottom to show only real data. The composition is:

1. **Health Score Hero** - animated circular gauge driven by a composite formula (30% steps %, 25% water %, 25% active-goal completion avg, 20% prediction recency), streak counter that walks back day-by-day counting days with `stepsPct >= 50 || waterPct >= 50`, and a rule-based **Next Action** CTA (`steps < 50%` -> "Take a walk", `water < 75%` -> "Drink water", no prediction in 7 d -> "Check symptoms", else "You're on track").
2. **Quick Actions bar** - three gradient pill buttons: Run Symptoms Check, Start Walking, Add a Goal. Full 3-col grid on mobile with icon-over-label layout; row layout on desktop.
3. **Enhanced stat row** - Daily Steps with 7-point sparkline + trend chip, Water Intake glass grid with gradient fills and radial goal indicator, Active Goals showing top-2 mini progress bars, Weather tied to `forecast.activities[0]` for a health-aware "Great for a walk" chip.
4. **Weekly Health Trends** (real data) - multi-series area chart: healthScore (indigo -> cyan gradient fill), stepsPct (orange line), waterPct (cyan dashed line). Pill-toggle for 7 d / 30 d range, legend strip with current values, tooltip showing all three metrics per day.
5. **Today's Focus** - pulled from the user's real goals, one row per goal with gradient progress bar matching the goal type (water=cyan, steps=amber, sleep=indigo, etc.), one-tap `+` button that calls `POST /goals/:id/progress`.
6. **Latest Symptoms Prediction** - violet accent card with direct "View full details" link to the symptoms page.
7. **Smart Insights** - calls `GET /api/dashboard/insights` which sends today's context (steps, water, goals, latest predictions) to OpenAI `gpt-3.5-turbo` (JSON response, max 400 tokens, 15-min in-memory cache per user). Each insight has a severity-tinted icon (info=blue, warn=amber, critical=rose). Automatic fallback to a rule-based generator if the LLM is unavailable.
8. **Recent Activity** - single card that unifies symptoms + heart/diabetes history, tabbed with All / Symptoms / Heart & Diabetes, dedupes consecutive identical symptom rows with a `x2` chip, each row icon-differentiated and clickable through to its detail page.

### Required environment for the dashboard

- `OPENAI_API_KEY` - powers Smart Insights LLM; if missing the card automatically shows rule-based tips instead (no broken state).
- No other config needed - all data flows from existing `WalkEarn`, `HealthData`, `Goal`, `SymptomPrediction`, and `RiskPrediction` models.

---

## AI Personal Health Assistant

The dashboard AI Chatbot page is a full personal health assistant. All new integrations are free and key-light — only `GROQ_API_KEY` is required.

### Capabilities

- **Report Analysis:** Upload a medical report (PDF/DOCX) through the chat paperclip. The backend extracts text (`pdf-parse` / `mammoth`), sends it to Groq Llama 3.3 70B with a strict JSON schema, and returns a structured payload: `reportType`, `summary`, `keyFindings[]`, `flags[]`, `recommendedActions[]`, `suggestedMedications[]`, `suggestedSpecialists[]`. The frontend renders a `ReportSummaryCard` with action buttons (Explain medications / Find nearby specialist).
- **Medicine Explanation:** Any drug name is enriched with openFDA label fields (uses, dosage, side effects, warnings, interactions, contraindications) + RxNav drug class. `fdaTextCleaner.js` strips FDA cross-references like `[see Warnings and Precautions (5.1)]`, section prefixes, and duplicate sentences. Interactions are keyword-matched against the logged-in user's `profile.medications` and a red banner is shown for any hit.
- **Nearby Specialists:** A seeded `Doctor` MongoDB collection (758 records across 21 Indian metros, 32 specialties, 2dsphere indexed) is queried by `$geoNear`. Suburb names (e.g. Dombivali, Whitefield, Pimpri-Chinchwad) and GPS coordinates within 50 km of a major metro are snapped to the parent metro via a city alias map for accurate results. If fewer than 4 seeded doctors match and the location is not metro-resolved, OpenStreetMap Overpass is queried for `amenity=hospital|clinic|doctors` as a fallback. Results are merged and rendered in a `DoctorGrid` with Call / Map / Book action buttons. Location comes from browser geolocation or a manual city input (geocoded via Open-Meteo).

### Free data sources (no API key required)

- **openFDA** — drug label data
- **NIH RxNav** — drug normalization + ATC drug class
- **OpenStreetMap Overpass** — nearby healthcare places
- **Open-Meteo Geocoding** — city -> coordinates

### Required key

- `GROQ_API_KEY` from [console.groq.com/keys](https://console.groq.com/keys) — free tier powers report analysis.

### Seed the doctor directory

```bash
cd Backend
node seeds/seedDoctors.js
```

Seeds 758 doctors across 21 Indian metros covering 32 specialties (25 curated + 565 high-volume + 288 niche super-specialties such as neurosurgeon, oncologist, plastic surgeon). Loads `Backend/data/generatedDoctors.json` and `Backend/data/nicheDoctors.json` alongside the inline curated set. Idempotent — safe to re-run.

---

## Testing

```bash
# Specific medicine
node Backend/tests/testFdaApi.js --detailed ibuprofen

# Common medicine test suite
node Backend/tests/testFdaApi.js

# Prediction API tests (requires JWT token)
# Optional when backend runs on 5000 (script fallback is 5001):
# Windows PowerShell: $env:API_BASE_URL="http://localhost:5000/api"
# Unix/macOS: export API_BASE_URL="http://localhost:5000/api"
# Windows PowerShell:
# $env:HEALANCE_TOKEN="your_jwt_token"
# Unix/macOS:
# export HEALANCE_TOKEN="your_jwt_token"
node Backend/tests/testPredictApi.js
```

---

## Deployment

Live production targets:

| Tier | Host | URL |
|---|---|---|
| Frontend (SPA) | Vercel | https://healance-ai-orbit.vercel.app |
| Backend (Node/Express) | Render Web Service | https://healanceai-backend.onrender.com |
| ML inference (Python/FastAPI) | Render Web Service | https://healanceai-ml.onrender.com |
| Database | MongoDB Atlas (M0) | — |
| File storage | Cloudinary | — |

Infra-as-code: [`render.yaml`](render.yaml) at the repo root provisions both Render services via Blueprint. [`Frontend/vercel.json`](Frontend/vercel.json) configures SPA rewrites and security headers for Vercel.

Step-by-step deploy procedure, env var matrix, and verification checklist: [`docs/SETUP.md`](docs/SETUP.md#deployment) and [`docs/env-setup.md`](docs/env-setup.md).

**Build command (frontend):** `npm run build` — output: `dist/`

### Free-tier cold-start mitigation (production)

Render free-tier dynos sleep after ~15 minutes of inactivity, costing 30–60 s on the next request. The deploy layers four free, ToS-compliant mitigations so most users never see a cold start:

1. **`<link rel="preconnect">` hints** in [`Frontend/index.html`](Frontend/index.html) — DNS + TCP + TLS handshakes to both Render domains start while the page is still parsing.
2. **On-mount wake-up pings** from [`Frontend/src/lib/wakeProductionServices.js`](Frontend/src/lib/wakeProductionServices.js) — `main.jsx` fires `GET /health` to backend and ML on every page load (production only via `import.meta.env.PROD`). The ML FastAPI service has CORS configured to allow the Vercel origin.
3. **Per-feature pre-warm** — the prediction page calls authenticated `GET /api/predict/warmup` on mount so ML is awake by the time the user clicks Predict.
4. **Auto-retry + clean error surface** — [`Backend/utils/mlPredictor.js`](Backend/utils/mlPredictor.js) detects Render's HTML 502 page and 5xx transient codes, retries once after 2 s, and returns a structured `ML_WARMING` error. The frontend translates this to "AI service is warming up — retry in ~30 s" instead of leaking raw HTML.

---

## NPM Scripts

### Backend (`Backend/package.json`)

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed demo data

### Frontend (`Frontend/package.json`)

- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

---

## Troubleshooting

**MongoDB Connection Error**

- Ensure MongoDB is running and accessible
- Check `MONGO_URI` in `Backend/.env`

**CORS or API URL Errors**

- Verify `CLIENT_URL` in backend `.env`
- Verify `VITE_API_URL` in `Frontend/.env`
- Ensure backend and frontend ports match configured URLs (`5000` recommended)

**ML / prediction errors**

- Confirm `ML_SERVICE_URL` and `ML_SERVICE_TOKEN` are set in `Backend/.env` and the FastAPI service is running (`curl <url>/health` should return `{"status":"ok"}`)
- For local dev, ensure `pip install -r requirements-dev.txt` succeeded inside `ML Services02/`
- If model files are missing, retrain via `train_models.py` / `train_symptom_model.py` in `ML Services/` and copy the output into `ML Services02/models/`

**Token/Auth Issues**

- Clear cookies/local storage and login again
- Check JWT secret consistency across environment

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push your branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## Contact & Support

- Email: aadigunjal0975@gmail.com
- Issues: [GitHub Issues](https://github.com/aaditya09750/HealanceAI-Orbit/issues)
- Discussions: [GitHub Discussions](https://github.com/aaditya09750/HealanceAI-Orbit/discussions)

---

## Acknowledgments

- FDA openFDA API for medicine data
- NIH RxNav for drug normalization and drug-class data
- OpenStreetMap Overpass for nearby healthcare places
- Open-Meteo APIs for weather, air-quality, pollen, and geocoding data
- OpenWeatherMap as optional weather provider
- Groq (Llama 3.3) for free-tier report-analysis LLM
- Tailwind CSS for frontend styling
- React and Node.js communities

---

## License

This project is licensed under the MIT License.
