# Setup

End-to-end local development walkthrough for HealanceAI-Orbit. If you only need a single tier, skip the others — `Backend/` and `Frontend/` install and run independently.

For deployment, see the [README](../README.md) and [docs/ARCHITECTURE.md](ARCHITECTURE.md) — production targets are operator's choice; document yours in this file once decided.

---

## Prerequisites

| Tool        | Version | Purpose                                           |
|-------------|---------|---------------------------------------------------|
| Node.js     | 20.x    | Runtime for `Backend/` and `Frontend/`. See [.nvmrc](../.nvmrc). |
| npm         | 10+     | Package manager (ships with Node 20).             |
| MongoDB     | 6.x+    | Local instance, Docker container, or MongoDB Atlas connection string. |
| Python      | 3.10+   | Required only if you want ML-backed predictions to run.        |
| Git         | any     | Clone the repo.                                   |

Verify before continuing:

```bash
node --version    # v20.x
npm --version     # 10+
python --version  # 3.10+ (or python3)
mongod --version  # any 6.x+ if running locally
```

---

## Clone

```bash
git clone https://github.com/aaditya09750/HealanceAI-Orbit.git
cd HealanceAI-Orbit
```

The repo has three sibling tiers: [Backend/](../Backend/), [Frontend/](../Frontend/), and [ML Services/](../ML%20Services/). The architectural rationale for keeping them as siblings instead of a workspace monorepo is in [ADR-0001](ADRs/0001-sibling-app-layout.md).

---

## Backend

```bash
cd Backend
cp .env.example .env
# fill in MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET at minimum
npm install
npm run dev   # starts nodemon on PORT (default 5000)
```

Verify the server is up:

```bash
curl http://localhost:5000/api/health
# → { "status": "ok", ... }
```

Useful scripts:

| Script | Purpose |
|---|---|
| `npm run dev` | Run with nodemon (auto-restart on file change). |
| `npm start` | Run plain `node server.js`. |
| `npm run dev:clean` | Free port 5000 (`kill-port`), then `npm run dev`. |
| `npm run lint` / `npm run lint:fix` | ESLint over the backend. |
| `npm run format:check` / `npm run format` | Prettier check / write. |
| `npm run seed` | Seed MongoDB with sample data via `seeds/seedData.js`. |

The full middleware chain, route mounts, and error handling are described in [ARCHITECTURE.md §3](../ARCHITECTURE.md#3-request-pipeline).

---

## Frontend

In a second terminal:

```bash
cd Frontend
cp .env.example .env
# default VITE_API_URL=http://localhost:5000/api will work for local backend
npm install
npm run dev   # Vite on http://localhost:5173
```

Open http://localhost:5173. The home page should render. Click "Sign in" — the auth modal opens. After login, you're redirected to `/dashboard`.

Useful scripts:

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server with HMR. |
| `npm run build` | Production build to `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` / `npm run lint:fix` | ESLint over the frontend. |
| `npm run format:check` / `npm run format` | Prettier check / write. |

<!-- TODO: screenshot of the dashboard landing page after first successful login -->

---

## ML Services

The backend calls a separate Python FastAPI service over HTTP (see [ADR-0005](ADRs/0005-ml-http-service.md)). The service lives in `ML Services02/`. The legacy `ML Services/` directory still holds training scripts and datasets but is no longer on the runtime path.

You have two choices for local development:

### Option A — Run the ML service locally (full local parity)

```bash
cd "ML Services02"
pip install -r requirements-dev.txt   # looser pins for newer Python (3.12+/3.14)
# or: pip install -r requirements.txt  # strict pins matching production (Python 3.11)
uvicorn app:app --port 8001
```

You should see `INFO: Application startup complete.` after the 44 MB symptom artifact finishes loading.

Then in `Backend/.env`:

```env
ML_SERVICE_URL=http://localhost:8001
ML_SERVICE_TOKEN=          # leave blank locally; the service skips auth when empty
```

### Option B — Point local backend at the deployed ML service

```env
ML_SERVICE_URL=https://healanceai-ml.onrender.com
ML_SERVICE_TOKEN=<paste the same token configured on Render>
```

No Python install required. Predictions are slightly slower (network RTT + free-tier cold starts) but adequate for dev work.

Without either option configured, `/api/predict/*` and `/api/risk-prediction/analyze` return errors but the rest of the app works.

<!-- TODO: screenshot of a successful heart-disease prediction in the dashboard -->

---

## Environment variables

> First-time setup? See [env-setup.md](env-setup.md) for click-by-click walkthroughs of every variable (which page to open, which button to click, what to copy, where to paste).

The backend reads roughly thirty variables. The complete list with inline notes is in [Backend/.env.example](../Backend/.env.example). The frontend reads a single variable, [Frontend/.env.example](../Frontend/.env.example):

```env
VITE_API_URL=http://localhost:5000/api
```

The sections below cover each external integration. **Every endpoint that depends on a missing key fails gracefully** — the backend logs a warning, and most controllers fall back to a built-in dataset or a clear error response. You only need keys for the integrations you actually want to exercise.

---

## OpenAI

Used for the health and medicine chatbot in [`/api/chatbot/message`](API.md#post-apichatbotmessage).

1. Create an account at https://platform.openai.com/.
2. Generate a key under **Dashboard → API keys**.
3. Add to `Backend/.env`:

```env
OPENAI_API_KEY=YOUR_OPENAI_KEY_HERE
```

Costs: standard OpenAI rates per token. Without the key, the chatbot falls back to a static knowledge-base response.

<!-- TODO: screenshot of the OpenAI API keys page -->

---

## Groq (medical reasoning)

Used for medical report analysis, adaptive symptom questions, and disease-prediction refinement via [`Backend/utils/groqClient.js`](../Backend/utils/groqClient.js). The Groq SDK reuses the OpenAI client with a swapped `baseURL`.

1. Sign up at https://console.groq.com/.
2. Generate a key under **API Keys**.
3. Add to `Backend/.env`:

```env
GROQ_API_KEY=YOUR_GROQ_KEY_HERE
```

The client targets `llama-3.3-70b-versatile` with a fallback to `llama-3.1-8b-instant`. Free-tier rate limit (~30 RPM) is enforced client-side at 28 req/min. Without the key, report analysis returns a "feature unavailable" message.

---

## Twilio (SMS OTP)

Used for SMS-based login and signup OTP flows in [`/api/sms/*`](API.md#sms).

1. Sign up at https://www.twilio.com/.
2. From the console, obtain `ACCOUNT_SID`, `AUTH_TOKEN`, and provision a phone number.
3. Add to `Backend/.env`:

```env
TWILIO_ACCOUNT_SID=YOUR_ACCOUNT_SID_HERE
TWILIO_AUTH_TOKEN=YOUR_AUTH_TOKEN_HERE
TWILIO_PHONE_NUMBER=+10000000000
```

Trial accounts can only send SMS to verified numbers. Without the keys, the SMS endpoints return a configuration error.

<!-- TODO: screenshot of the Twilio console showing account SID and auth token -->

---

## WhatsApp Cloud API (Meta)

Used for WhatsApp OTP login/signup in [`/api/whatsapp/*`](API.md#whatsapp).

1. Create a Meta Business account and a WhatsApp Business app at https://developers.facebook.com/.
2. Add the WhatsApp product, then under **API Setup** copy the **Phone Number ID** and a **Permanent Access Token**.
3. Approve a message template (the controller uses a simple text template for OTPs; for production traffic you must register an approved template).
4. Add to `Backend/.env`:

```env
WHATSAPP_ACCESS_TOKEN=YOUR_META_LONG_LIVED_TOKEN
WHATSAPP_PHONE_NUMBER_ID=YOUR_PHONE_NUMBER_ID
```

In non-production environments without a token, the controller logs the OTP to stderr instead of sending it (look for `devOtp` in the JSON response when `NODE_ENV !== 'production'`).

<!-- TODO: screenshot of the Meta WhatsApp Business API Setup page -->

---

## Gmail SMTP (Nodemailer)

Used for the welcome email, password reset email, and contact-form confirmation.

1. Use a Gmail account with **2-Step Verification** enabled.
2. Generate an **App password** at https://myaccount.google.com/apppasswords (select "Mail" → "Other").
3. Add to `Backend/.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-account@gmail.com
EMAIL_PASS=YOUR_16_CHAR_APP_PASSWORD
ADMIN_EMAIL=your-account@gmail.com
```

`EMAIL_USER` falls back to `ADMIN_EMAIL` if unset. Any SMTP provider works; replace the host/port accordingly.

If `EMAIL_PASS` is missing, email-sending controllers degrade gracefully — the contact form still saves the submission, but `emailDelivered: false` is returned.

---

## Public APIs (no key required)

These integrations have no setup. They impose their own rate limits and the backend caches responses where appropriate.

| Integration | Used by | Limits / notes |
|---|---|---|
| **openFDA** (`api.fda.gov`) | [`/api/chatbot/explain-medicine`](API.md#post-apichatbotexplain-medicine) — drug labels, adverse events. | 240 requests/min unauthenticated; the optional `FDA_API_KEY` raises this to 120k/day. |
| **RxNav** (`rxnav.nlm.nih.gov`) | Drug-class lookup and interaction matching alongside FDA labels. | NIH-public; 24-hour in-memory cache per drug. |
| **OpenStreetMap Overpass** (`overpass-api.de`) | [`/api/chatbot/nearby-doctors`](API.md#post-apichatbotnearby-doctors) fallback when the seeded `Doctor` collection is sparse. | Etiquette: ~1 req/sec per IP; backend caches results for 1 hour per ~1km grid cell. |
| **Open-Meteo** (`open-meteo.com`) | Geocoding and weather forecasts in [`/api/chatbot/geocode`](API.md#post-apichatbotgeocode) and [`/api/forecast`](API.md#forecast). | Free, no key. |

---

## Seed data

```bash
cd Backend
npm run seed
```

This runs `Backend/seeds/seedData.js` which inserts a baseline of doctors, blogs, and rewards. Re-run any time to reset; check the script for upsert vs. truncate behavior before pointing it at a database with real data.

---

## End-to-end verification

After `Backend` and `Frontend` are running and at least `MONGO_URI`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` are set:

1. **Health check:** `curl http://localhost:5000/api/health` returns 200.
2. **Sign up:** Open http://localhost:5173, click sign-in, switch to "Create account", fill the form, submit. You should land on `/dashboard`.
3. **Log a vital:** From the dashboard, log a heart rate or step count. Reload the page; the value persists.
4. **Run a prediction:** Open `/dashboard/risk-prediction`, fill the form, submit. If Python and the model files are set up, you receive a risk assessment within a few seconds. If not, you receive a clear error referencing `mlPredictor.js`.
5. **Open the body explorer:** `/dashboard/body-explorer` — public-fallback endpoints render even without DB seed data.

If any of these fail, check `Backend` stdout for the controller-level error and confirm the relevant env var from this document is set.

---

## Deployment

Production targets:

- **Frontend (SPA):** Vercel — https://healance-ai-orbit.vercel.app
- **Backend (Node):** Render Web Service — https://healanceai-backend.onrender.com
- **ML inference (Python):** Render Web Service — https://healanceai-ml.onrender.com
- **Database:** MongoDB Atlas (M0 free)
- **Uploads:** Cloudinary (avatars, medical reports, support attachments)

Infrastructure is declared in [`render.yaml`](../render.yaml) at the repo root — Render's Blueprint feature reads this file and provisions both services. Vercel is configured via [`Frontend/vercel.json`](../Frontend/vercel.json) for SPA rewrites and security headers.

### Deploy order (matters)

1. Render → New → Blueprint → connect repo → apply `render.yaml`. The ML service deploys first (it has no dependencies); the backend deploys in parallel but boots only after `ML_SERVICE_URL` is filled in.
2. Fill in env vars marked `sync: false` in the Render dashboard for both services. `ML_SERVICE_TOKEN` must be **identical** on both.
3. Vercel → Import project → Root Directory `Frontend` → Framework `Vite` → set `VITE_API_URL=https://healanceai-backend.onrender.com/api`.
4. After the Vercel deploy gets a URL, set `CLIENT_URL` on the Render backend to the Vercel domain (no trailing slash). Without this, CORS rejects the production frontend.

### Production-only configuration

- Backend cookies switch to `SameSite=None; Secure` automatically when `NODE_ENV=production` (required for Vercel↔Render cross-domain auth — see `Backend/utils/generateToken.js`).
- Render free tier sleeps after ~15 min idle; first request after wake takes 30–60 s (cold start). Surface this in the UI for prediction-heavy pages if user expectations require it.
- The ML service authenticates backend calls via `X-ML-Service-Token` — keep `ML_SERVICE_TOKEN` long and rotate on suspected leak.

A complete env var matrix (which platform each variable belongs to) is in [`docs/env-setup.md`](env-setup.md).
