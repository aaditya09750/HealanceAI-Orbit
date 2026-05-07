# Healance AI - Backend API

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-8.x-880000?style=for-the-badge&logo=mongoose&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-FFB300?style=for-the-badge&logo=jsonwebtokens&logoColor=black)
![openFDA](https://img.shields.io/badge/openFDA-Integrated-0A66C2?style=for-the-badge)
![Groq](https://img.shields.io/badge/Groq-LLM-F55036?style=for-the-badge)
![RxNav](https://img.shields.io/badge/RxNav-NIH-1E6091?style=for-the-badge)
![OpenStreetMap](https://img.shields.io/badge/OpenStreetMap-Overpass-7EBC6F?style=for-the-badge&logo=openstreetmap&logoColor=white)

Backend API for Healance AI, built with Express and MongoDB. It powers authentication, health tracking, AI chatbots, the AI Personal Health Assistant (report analysis, medicine enrichment, nearby specialists), risk prediction, goals, walk-and-earn, notifications, blogs, and support workflows.

---

## Core Features

- JWT auth with secure HTTP-only cookie support
- Role-based access (`user`, `admin`)
- Health data tracking and dashboard stats APIs
- Dashboard aggregator: composite health score, streak counter, next-action picker, multi-metric trends series, and LLM-backed Smart Insights with in-memory cache and rule-based fallback
- AI health assistant and medicine information chatbot
- AI Personal Health Assistant: PDF/DOCX report analysis (Groq Llama 3.3), medicine explanation with drug-drug interaction checks (openFDA + NIH RxNav), nearby specialist lookup over 758 seeded doctors with metro alias resolver + OpenStreetMap Overpass fallback
- Risk analysis and recommendation APIs
- Python ML integration for heart/diabetes and symptom-disease predictions
- Body Explorer catalog: 34 parts across 12 systems with search, system filter, gender filter, and systems-meta endpoint
- Goal management with progress logging
- Walk-and-earn points and rewards redemption
- Notification center and reminder APIs
- Blog and bookmark APIs
- Contact form and support ticket system with file attachments
- SMS and WhatsApp OTP workflows

---

## Technology Stack

| Technology | Version | Purpose |
| ---------- | ------- | ------- |
| Node.js | 18+ | Runtime |
| Express | 4.21.x | API framework |
| MongoDB | 8.x | Database |
| Mongoose | 8.x | ODM |
| JWT | 9.x | Authentication |
| bcryptjs | 2.4.x | Password hashing |
| Multer | 1.4.x | Upload handling |
| Nodemailer | 8.0.x | Emails |
| Twilio | 5.5.x | SMS and WhatsApp messaging |
| OpenAI | 4.x | Optional chatbot enhancement / Groq SDK compatibility |
| Groq (Llama 3.3 70B) | via `openai` SDK | Report analysis LLM (free tier) |
| OpenAI GPT-3.5-turbo | via `openai` SDK | Dashboard Smart Insights (15-min per-user cache, rule-based fallback) |
| pdf-parse | 2.4.x | PDF text extraction |
| mammoth | 1.12.x | DOCX text extraction |
| NIH RxNav | Public API | Drug normalization, class, interaction matching |
| OpenStreetMap Overpass | Public API | Nearby healthcare places |
| Open-Meteo Geocoding | Public API | City -> coordinates |
| Helmet | 7.x | Security headers |
| express-rate-limit | 7.x | API rate limiting |

---

## Project Structure

```text
Backend/
+-- config/
|   +-- db.js
+-- controllers/
|   +-- authController.js
|   +-- healthController.js
|   +-- riskController.js
|   +-- chatbotController.js
|   +-- dashboardController.js    (summary, trends, insights; LLM + cache + fallback)
|   +-- bodyExplorerController.js (34 parts / 12 systems catalog + systems meta)
|   +-- ...
+-- middleware/
|   +-- authMiddleware.js
|   +-- errorMiddleware.js
|   +-- uploadMiddleware.js
+-- models/
|   +-- User.js
|   +-- HealthData.js
|   +-- MedicalReport.js
|   +-- RiskPrediction.js
|   +-- ChatSession.js
|   +-- Doctor.js
|   +-- ...
+-- routes/
|   +-- authRoutes.js
|   +-- healthRoutes.js
|   +-- riskRoutes.js
|   +-- chatbotRoutes.js
|   +-- dashboardRoutes.js
|   +-- bodyExplorerRoutes.js
|   +-- ...
+-- data/
|   +-- allowedDiseases.json
|   +-- cityAliases.json              (metro centers + suburb -> metro aliases)
|   +-- generatedDoctors.json         (565 high-volume specialty records)
|   +-- nicheDoctors.json             (288 niche-specialty records)
|   +-- symptomFollowUps.js
+-- seeds/
|   +-- seedData.js
|   +-- seedDoctors.js
|   +-- generateNicheDoctorsLocal.js  (regenerates nicheDoctors.json, no LLM)
+-- tests/
|   +-- testFdaApi.js
+-- utils/
|   +-- fdaApi.js
|   +-- fdaTextCleaner.js
|   +-- textExtractor.js
|   +-- reportAnalyzer.js
|   +-- groqClient.js
|   +-- rxNavApi.js
|   +-- osmOverpass.js
|   +-- geocode.js                    (alias-aware city resolver + GPS metro snap)
|   +-- generateToken.js
|   +-- sendEmail.js
+-- .env.example
+-- package.json
+-- server.js
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm

### Installation

```bash
cd Backend
npm install
cp .env.example .env
```

Windows alternative:

```powershell
copy .env.example .env
```

### Run Development Server

```bash
npm run dev
```

Default API base URL:

```text
http://localhost:5000/api
```

Health check endpoint:

```text
GET /api/health
```

---

## Environment Variables

From `Backend/.env.example`:

| Variable | Required | Default/Example | Purpose |
| -------- | -------- | --------------- | ------- |
| `PORT` | No | `5000` | Server port |
| `NODE_ENV` | No | `development` | Environment mode |
| `MONGO_URI` | Yes | `mongodb://localhost:27017/healance_ai` | MongoDB connection string |
| `JWT_SECRET` | Yes | `your_secret` | JWT signing secret |
| `JWT_EXPIRE` | No | `15m` | Access token expiry |
| `JWT_REFRESH_SECRET` | No | `your_refresh_secret` | Refresh token signing secret (falls back to `JWT_SECRET`) |
| `JWT_REFRESH_EXPIRE` | No | `30d` | Refresh token expiry |
| `CLIENT_URL` | Yes | `http://localhost:5173` | CORS allowed frontend origin |
| `OPENAI_API_KEY` | No (Yes for dashboard Smart Insights) | `sk-...` | Powers `/dashboard/insights` LLM generator (falls back to rule-based tips when missing) and optional chatbot enhancement |
| `GROQ_API_KEY` | No (Yes for report analysis) | `gsk_...` | Groq Llama 3.3 70B for `/chatbot/analyze-report` (free tier at console.groq.com/keys) |
| `GEMINI_API_KEY` | No | `AIzaSy...` | Optional Gemini fallback LLM (aistudio.google.com/app/apikey) |
| `FDA_API_KEY` | No | empty | Reserved (openFDA is public) |
| `WEATHER_API_KEY` | No | `your_openweathermap_api_key` | Optional OpenWeather key (fallback to Open-Meteo) |
| `OPENWEATHER_API_KEY` | No | empty | Alternate weather key variable name |
| `WEATHER_API_BASE_URL` | No | `https://api.openweathermap.org/data/2.5` | Weather API base URL |
| `WEATHER_UNITS` | No | `metric` | Units for weather temperature/speed |
| `EMAIL_HOST` | No | `smtp.gmail.com` | SMTP host |
| `EMAIL_PORT` | No | `587` | SMTP port |
| `EMAIL_USER` | No | `your-email@gmail.com` | SMTP user |
| `EMAIL_PASS` | No | `your-app-password` | SMTP password/app password |
| `ADMIN_EMAIL` | No | `agroreach01@gmail.com` | Admin alert email |
| `WHATSAPP_ACCESS_TOKEN` | No | `your-whatsapp-access-token` | WhatsApp Cloud API access token |
| `WHATSAPP_PHONE_NUMBER_ID` | No | `your-whatsapp-phone-number-id` | WhatsApp sender phone number ID |
| `TWILIO_ACCOUNT_SID` | No | `your_twilio_account_sid` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | No | `your_twilio_auth_token` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | No | `+12345678900` | Twilio sender number |
| `PYTHON_BIN` | No | `python` (Windows) / `python3` (Unix) | Python executable path override for ML scripts |
| `MAX_FILE_SIZE` | No | `10485760` | Upload size limit in bytes |
| `UPLOAD_PATH` | No | `./uploads` | Upload path reference |

---

Forecast note: OpenWeather variables are optional. If unavailable, forecast endpoints automatically use Open-Meteo weather, air quality, and pollen services.

---

## Authentication

Protected routes use `protect` middleware and accept token from:

- `Authorization: Bearer <token>`
- `accessToken` cookie (HTTP-only)
- `token` cookie (legacy backward compatibility)

Admin routes require:

- authenticated user
- `role === "admin"`

---

## API Conventions

### Success Response

```json
{
  "success": true,
  "data": {}
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description"
}
```

---

## API Endpoints

Base URL: `http://localhost:5000/api`

### Health

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| GET | `/health` | Public | API health status |

### Authentication

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| POST | `/auth/register` | Public | Register user |
| POST | `/auth/login` | Public | Login user |
| POST | `/auth/logout` | Public | Logout and clear auth cookie |
| GET | `/auth/me` | Protected | Get current user |
| POST | `/auth/social` | Public | Social login (Google/GitHub flow input) |
| POST | `/auth/forgot-password` | Public | Send reset email |
| PUT | `/auth/reset-password/:resetToken` | Public | Reset password using token |
| PUT | `/auth/update-password` | Protected | Change password while logged in |

### Users

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| PUT | `/users/profile` | Protected | Update profile fields |
| PUT | `/users/password` | Protected | Update password |
| GET | `/users/notifications` | Protected | Get latest user notifications |
| PUT | `/users/notifications/read-all` | Protected | Mark all user notifications as read |
| PUT | `/users/notifications/:id/read` | Protected | Mark one user notification as read |
| POST | `/users/bookmarks/:blogId` | Protected | Toggle blog bookmark |
| GET | `/users/bookmarks` | Protected | Get bookmarked blogs |

### Health Data

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| POST | `/health-data` | Protected | Add daily health data |
| GET | `/health-data/today` | Protected | Get today data or defaults |
| PUT | `/health-data/today` | Protected | Upsert today data |
| GET | `/health-data/weekly?days=7` | Protected | Get weekly trend series |
| GET | `/health-data/monthly` | Protected | Get monthly averages |
| GET | `/health-data/dashboard` | Protected | Get dashboard overview |
| POST | `/health-data/reports` | Protected | Upload medical report (`multipart/form-data`) |
| GET | `/health-data/reports` | Protected | List uploaded reports |

### Risk Prediction

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| POST | `/risk-prediction/analyze` | Protected | Analyze user health risk |
| GET | `/risk-prediction/history` | Protected | Last 10 predictions |
| GET | `/risk-prediction/latest` | Protected | Latest prediction |

### Chatbot

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| POST | `/chatbot/message` | Protected | Send message to health or medicine bot |
| GET | `/chatbot/sessions` | Protected | Get chat sessions (`?botType=health|medicine`) |
| GET | `/chatbot/sessions/:sessionId` | Protected | Get one session with messages |
| DELETE | `/chatbot/sessions/:sessionId` | Protected | Delete one chat session |
| POST | `/chatbot/analyze-report/:reportId` | Protected | Extract text + run Groq structured analysis on an uploaded report |
| POST | `/chatbot/explain-medicine` | Protected | Enrich a drug with openFDA label + RxNav class + interaction check vs `userMedications` |
| POST | `/chatbot/nearby-doctors` | Protected | `$geoNear` over 758 seeded doctors with metro alias resolver (suburb names + GPS coords snap to nearest metro within 50 km); OSM Overpass fallback when off-metro |
| POST | `/chatbot/geocode` | Protected | Resolve a city name to `{lat, lon, name}` via Open-Meteo |

### Dashboard

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| GET | `/dashboard/summary` | Protected | Composite `healthScore`, `streakDays`, `avgScore7d`, `topGoal`, `todayTotals`, and rule-based `nextAction` |
| GET | `/dashboard/trends?range=7d\|30d` | Protected | Per-day series `[{ date, label, stepsPct, waterPct, goalsPct, healthScore }]` aggregated from WalkEarn + HealthData + Goal |
| GET | `/dashboard/insights` | Protected | 2-3 `{ icon, severity, title, body }` insights; OpenAI `gpt-3.5-turbo` with strict JSON response, 15-min per-user in-memory cache, rule-based fallback if LLM unavailable |

### Body Explorer

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| GET | `/body-explorer` | Public | Get all body part data; supports `?search=`, `?system=`, `?gender=` query filters |
| GET | `/body-explorer/:partName` | Public | Get one body part with `system`, `relatedConditions`, `icd10Regions`, `relatedLinks`, `onlyFor` |
| GET | `/body-explorer/meta/systems` | Public | List distinct systems available in the catalog (for filter UI) |

### Goals

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| GET | `/goals/suggestions` | Protected | AI-style suggestions from active goals |
| GET | `/goals?status=active|completed` | Protected | Get goals list |
| POST | `/goals` | Protected | Create goal |
| PUT | `/goals/:id` | Protected | Update goal |
| DELETE | `/goals/:id` | Protected | Delete goal |
| POST | `/goals/:id/progress` | Protected | Log daily progress |

### Walk and Earn

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| POST | `/walk-earn/log-steps` | Protected | Log steps and convert to coins |
| GET | `/walk-earn/summary` | Protected | Fetch coins, today metrics, weekly data |
| GET | `/walk-earn/rewards` | Protected | List rewards and `canRedeem` flag |
| POST | `/walk-earn/redeem/:rewardId` | Protected | Redeem reward |
| GET | `/walk-earn/redemptions` | Protected | Redemption history |

Alias support: `/walkearn/*` is also mounted for backward compatibility.

### Forecast

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| GET | `/forecast?city=...` | Protected | Current weather-driven health forecast |
| GET | `/forecast?lat=...&lon=...` | Protected | Forecast by coordinates |
| GET | `/forecast/weekly` | Protected | Generated 7-day forecast |

### Blogs

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| GET | `/blogs/categories` | Public | Blog category list |
| GET | `/blogs/trending` | Public | Trending blogs |
| GET | `/blogs` | Public | Paginated blogs (`category`, `search`, `page`, `limit`) |
| GET | `/blogs/:identifier` | Public | Blog by slug or ObjectId |
| POST | `/blogs/:id/like` | Protected | Like a blog |
| POST | `/blogs` | Protected + Admin | Create blog |
| PUT | `/blogs/:id` | Protected + Admin | Update blog |
| DELETE | `/blogs/:id` | Protected + Admin | Delete blog |

### Contact and Support

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| POST | `/contact` | Public | Submit contact form |
| POST | `/contact/ticket` | Protected | Submit support ticket (`multipart/form-data`) |
| GET | `/contact/tickets` | Protected | Get my support tickets |
| GET | `/contact/admin/contacts` | Protected + Admin | Get all contact submissions |
| GET | `/contact/admin/tickets` | Protected + Admin | Get all support tickets (`?status=` optional) |
| PUT | `/contact/admin/tickets/:id` | Protected + Admin | Update ticket status |

### Notifications

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| GET | `/notifications?unreadOnly=true` | Protected | Get notifications and unread count |
| POST | `/notifications` | Protected | Create manual notification |
| PUT | `/notifications/read-all` | Protected | Mark all notifications as read |
| DELETE | `/notifications/clear-all` | Protected | Delete all notifications |
| POST | `/notifications/water-reminder` | Protected | Create water reminder notification |
| POST | `/notifications/activity` | Protected | Create activity notification |
| PUT | `/notifications/:id/read` | Protected | Mark one notification as read |
| DELETE | `/notifications/:id` | Protected | Delete one notification |

### Predict (ML)

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| POST | `/predict/diabetes` | Protected | Diabetes risk prediction |
| POST | `/predict/heart` | Protected | Heart risk prediction |
| POST | `/predict/all` | Protected | Combined heart + diabetes prediction |
| POST | `/predict/symptoms-disease` | Protected | Symptom-to-disease prediction |
| GET | `/predict/symptoms-history` | Protected | Symptom prediction history |
| POST | `/predict/share-whatsapp` | Protected | Share heart/diabetes prediction on WhatsApp |
| POST | `/predict/share-symptoms-whatsapp` | Protected | Share symptom prediction on WhatsApp |

### SMS

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| POST | `/sms/send` | Public | Send SMS |
| POST | `/sms/test` | Public | Send test SMS |
| POST | `/sms/send-login-otp` | Public | Send login OTP via SMS |
| POST | `/sms/verify-login-otp` | Public | Verify login OTP via SMS |

### WhatsApp

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| POST | `/whatsapp/send-login-otp` | Public | Send login OTP via WhatsApp |
| POST | `/whatsapp/verify-login-otp` | Public | Verify login OTP via WhatsApp |
| POST | `/whatsapp/send-signup-otp` | Public | Send signup OTP via WhatsApp |
| POST | `/whatsapp/verify-signup-otp` | Public | Verify signup OTP via WhatsApp |

---

## Request Examples

### Register

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "name": "Demo User",
  "email": "demo@healance.ai",
  "password": "demo123456"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "demo@healance.ai",
  "password": "demo123456"
}
```

### Add Health Data

```http
POST /api/health-data
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "vitals": {
    "heartRate": 76,
    "bloodPressure": { "systolic": 120, "diastolic": 80 },
    "bloodSugar": 98
  },
  "activity": {
    "steps": 7200,
    "caloriesBurned": 420,
    "activeMinutes": 55,
    "distance": 5.4
  },
  "waterIntake": 2.3,
  "sleep": {
    "duration": 7.5,
    "quality": "good"
  },
  "healthScore": 82,
  "mood": "good"
}
```

### Analyze Risk

```http
POST /api/risk-prediction/analyze
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "age": 35,
  "gender": "Male",
  "bloodPressure": "130/85",
  "cholesterol": 210,
  "bloodSugar": 102,
  "bmi": 24.1,
  "smokingStatus": "never",
  "exerciseFrequency": "3-4/week",
  "familyHistory": ["diabetes"]
}
```

### Chatbot Message

```http
POST /api/chatbot/message
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "message": "aspirin",
  "botType": "medicine"
}
```

### Analyze Uploaded Report

```http
POST /api/chatbot/analyze-report/:reportId
Authorization: Bearer <token>
```

Response payload (simplified):

```json
{
  "success": true,
  "status": "ok",
  "analysis": {
    "reportType": "blood_test",
    "summary": "Overall values within reference range except LDL cholesterol.",
    "keyFindings": [{ "label": "LDL", "value": "142 mg/dL", "status": "high" }],
    "flags": ["Elevated LDL cholesterol"],
    "recommendedActions": ["Reduce saturated fat", "Re-test in 3 months"],
    "suggestedMedications": [{ "name": "Atorvastatin" }],
    "suggestedSpecialists": ["cardiologist"]
  },
  "disclaimer": "Not a medical diagnosis. Consult a healthcare professional."
}
```

### Explain Medicine

```http
POST /api/chatbot/explain-medicine
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "name": "atorvastatin",
  "userMedications": ["warfarin"]
}
```

### Nearby Doctors

```http
POST /api/chatbot/nearby-doctors
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "specialty": "cardiologist",
  "lat": 19.076,
  "lon": 72.8777,
  "radius": 5000
}
```

### Geocode a City

```http
POST /api/chatbot/geocode
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "city": "Mumbai"
}
```

### Dashboard Summary

```http
GET /api/dashboard/summary
Authorization: Bearer <token>
```

Response payload (simplified):

```json
{
  "success": true,
  "data": {
    "healthScore": 72,
    "streakDays": 4,
    "avgScore7d": 68,
    "topGoal": { "title": "Daily Steps", "pct": 80 },
    "todayTotals": {
      "steps": 6200,
      "stepsGoal": 10000,
      "stepsPct": 62,
      "waterIntake": 2.0,
      "waterPct": 67,
      "goalsActive": 3,
      "goalsPct": 55
    },
    "nextAction": { "key": "water", "label": "Drink water", "href": null }
  }
}
```

### Dashboard Trends

```http
GET /api/dashboard/trends?range=7d
Authorization: Bearer <token>
```

### Dashboard Insights

```http
GET /api/dashboard/insights
Authorization: Bearer <token>
```

Response payload (LLM mode):

```json
{
  "success": true,
  "source": "llm",
  "cached": false,
  "insights": [
    { "icon": "activity", "severity": "warn", "title": "Pick up your pace", "body": "You're at 42% of today's step goal. A 20-minute walk lifts that into the green zone." },
    { "icon": "moon", "severity": "info", "title": "Hydration is on track", "body": "You've logged 2 L. One more glass and you're at the daily goal." }
  ]
}
```

### Create Goal

```http
POST /api/goals
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "type": "steps",
  "title": "Daily Steps",
  "current": 0,
  "target": 10000,
  "unit": "steps"
}
```

### Upload Medical Report

```bash
curl -X POST http://localhost:5000/api/health-data/reports \
  -H "Authorization: Bearer <token>" \
  -F "report=@report.pdf" \
  -F "title=Blood Work April" \
  -F "type=blood_test"
```

---

## File Uploads

Upload middleware supports:

- JPEG, PNG, GIF, SVG images
- PDF
- DOC, DOCX

Limits:

- max size: `MAX_FILE_SIZE` (default 10MB)
- support ticket attachments: max 5 files
- upload directory: `Backend/uploads` (served as `/uploads/*`)

---

## Security and Runtime Notes

- `helmet` enabled
- CORS locked to `CLIENT_URL` and credentials enabled
- Rate limit: `100` requests per `15` minutes on `/api/*`
- Passwords hashed with bcrypt (`12` salt rounds)
- `.env` and `uploads/` are gitignored

---

## Seed and Test Utilities

### Seed Demo Data

```bash
npm run seed
```

This seeds:

- demo users (`demo@healance.ai`, `admin@healance.ai`)
- blog posts
- rewards
- sample goals

### Seed Doctor Directory

```bash
node seeds/seedDoctors.js
```

Seeds 758 doctors across 21 Indian metros covering 32 specialties (25 curated + 565 high-volume + 288 niche super-specialties). Loads `data/generatedDoctors.json` and `data/nicheDoctors.json` in addition to the inline curated set. 2dsphere-indexed locations. Idempotent — safe to re-run.

To regenerate the niche-specialty dataset locally (no LLM, deterministic):

```bash
node seeds/generateNicheDoctorsLocal.js
```

### Test Medicine API Integration

```bash
node tests/testFdaApi.js --detailed aspirin
```

### Test Prediction APIs

```bash
# Optional when backend runs on 5000 (script fallback is 5001)
# PowerShell: $env:API_BASE_URL="http://localhost:5000/api"
# Unix/macOS: export API_BASE_URL="http://localhost:5000/api"

# PowerShell
$env:HEALANCE_TOKEN="your_jwt_token"
node tests/testPredictApi.js

# Unix/macOS
export HEALANCE_TOKEN="your_jwt_token"
node tests/testPredictApi.js
```

---

## NPM Scripts

| Script | Description |
| ------ | ----------- |
| `npm start` | Run production server |
| `npm run dev` | Run development server with nodemon |
| `npm run dev:clean` | Free port 5001 and restart dev server |
| `npm run seed` | Seed initial demo data |

---

## Troubleshooting

**MongoDB connection fails**

- verify `MONGO_URI`
- make sure MongoDB is running

**401 Unauthorized on protected routes**

- send `Authorization: Bearer <token>` header
- or ensure `token` cookie is present

**CORS issues**

- set correct `CLIENT_URL` in `.env`
- make sure frontend origin matches exactly

**Email not sent**

- check `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`
- use app password if using Gmail SMTP

**Report analysis returns `ai-unavailable`**

- ensure `GROQ_API_KEY` is set in `.env` and restart the server
- free tier limit: 30 req/min — retry after a short wait

**Dashboard Smart Insights show templated text instead of LLM output**

- that is the automatic rule-based fallback; set `OPENAI_API_KEY` in `.env` and restart the server to switch back to LLM mode
- per-user response is cached in-memory for 15 minutes; restart the server to clear the cache immediately

**Report analysis returns `file-missing`**

- the server resolves report paths relative to `Backend/uploads/`; verify the file exists and the `MedicalReport.filePath` field matches

**Nearby doctors returns empty results**

- run `node seeds/seedDoctors.js` to populate the `Doctor` collection
- OSM Overpass is rate-limited (~1 req/sec) — brief outages are expected

---

## License

This project is licensed under the MIT License.