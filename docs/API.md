# HTTP API Reference

Exhaustive reference for the HealanceAI-Orbit backend API. Every endpoint exposed by [Backend/server.js](../Backend/server.js) is documented below with method, path, auth requirement, request shape, response shape, status codes, and a copy-pasteable `curl`.

For architectural context (middleware chain, error envelope, auth flow) see [ARCHITECTURE.md](../ARCHITECTURE.md). For setup of third-party keys referenced here (OpenAI, Groq, Twilio, WhatsApp) see [SETUP.md](SETUP.md).

---

## Conventions

- **Base URL:** `http://localhost:5000/api` in dev. The frontend reads it from `VITE_API_URL` (see [Frontend/.env.example](../Frontend/.env.example)).
- **Auth markers:**
  - **public** — no token required.
  - **protected** — requires the `accessToken` (or legacy `token`) cookie, or `Authorization: Bearer <jwt>` header. Verified by `protect` middleware in [Backend/middleware/authMiddleware.js](../Backend/middleware/authMiddleware.js).
  - **admin** — requires `protected` plus `req.user.role === 'admin'`.
- **Cookies:** the frontend sets `withCredentials: true` on all axios requests. `curl` examples use `-b cookies.txt -c cookies.txt` to round-trip cookies; replace with whatever your client uses.
- **Success envelope:** most endpoints return `{ success: true, ...payload }`.
- **Error envelope:** the global handler in [Backend/middleware/errorMiddleware.js](../Backend/middleware/errorMiddleware.js) emits `{ success: false, message: string, errors?: object }` with the HTTP status mapped from the underlying error type:
  - Mongoose `CastError` → 404 "Resource not found".
  - Mongoose duplicate-key (E11000) → 400 "Duplicate field: <field>".
  - Mongoose `ValidationError` → 400 with per-field messages.
  - `JsonWebTokenError` → 401 "Invalid token".
  - `TokenExpiredError` → 401 "Token expired".
  - Otherwise → 500 with the original message.
- **Rate limits:** `1200 req / 15 min` globally on `/api/*`; `60 req / 15 min` on `/api/auth`. A 429 response includes a `Retry-After` header; the frontend retries with backoff (max 2 retries) automatically.
- **CORS:** credentialed; origin must match the value or list in `CLIENT_URL` (`http://localhost:5173` by default).

## Quick reference

| Mount | Module | Section |
|---|---|---|
| `/api/auth` | [authRoutes.js](../Backend/routes/authRoutes.js) | [Auth](#auth) |
| `/api/users` | [userRoutes.js](../Backend/routes/userRoutes.js) | [Users](#users) |
| `/api/health-data` | [healthRoutes.js](../Backend/routes/healthRoutes.js) | [Health Data](#health-data) |
| `/api/risk-prediction` | [riskRoutes.js](../Backend/routes/riskRoutes.js) | [Risk Prediction](#risk-prediction) |
| `/api/chatbot` | [chatbotRoutes.js](../Backend/routes/chatbotRoutes.js) | [Chatbot](#chatbot) |
| `/api/body-explorer` | [bodyExplorerRoutes.js](../Backend/routes/bodyExplorerRoutes.js) | [Body Explorer](#body-explorer) |
| `/api/goals` | [goalRoutes.js](../Backend/routes/goalRoutes.js) | [Goals](#goals) |
| `/api/walk-earn` (alias `/api/walkearn`) | [walkEarnRoutes.js](../Backend/routes/walkEarnRoutes.js) | [Walk & Earn](#walk--earn) |
| `/api/forecast` | [forecastRoutes.js](../Backend/routes/forecastRoutes.js) | [Forecast](#forecast) |
| `/api/blogs` | [blogRoutes.js](../Backend/routes/blogRoutes.js) | [Blogs](#blogs) |
| `/api/contact` | [contactRoutes.js](../Backend/routes/contactRoutes.js) | [Contact](#contact) |
| `/api/notifications` | [notificationRoutes.js](../Backend/routes/notificationRoutes.js) | [Notifications](#notifications) |
| `/api/whatsapp` | [whatsappRoutes.js](../Backend/routes/whatsappRoutes.js) | [WhatsApp](#whatsapp) |
| `/api/sms` | [smsRoutes.js](../Backend/routes/smsRoutes.js) | [SMS](#sms) |
| `/api/predict` | [predictRoutes.js](../Backend/routes/predictRoutes.js) | [Predict](#predict) |
| `/api/dashboard` | [dashboardRoutes.js](../Backend/routes/dashboardRoutes.js) | [Dashboard](#dashboard) |
| `/api/health` | inline in `server.js` | [Health Check](#health-check) |

---

## Health check

### GET /api/health

- **Auth:** public
- **Purpose:** Liveness probe.
- **Response (200):** `{ "status": "ok", "uptime": <seconds>, "timestamp": <ISO> }`

```bash
curl http://localhost:5000/api/health
```

---

## Auth

### POST /api/auth/register

- **Auth:** public
- **Purpose:** Create a new user account, issue tokens, and send a welcome notification.
- **Request body:** `{ name (string, req), email (string, req), password (string, req, min 6), whatsappNumber (string, optional, intl format) }`
- **Response (201):** `{ success: true, user, accessToken, refreshToken }`
- **Errors:** 400 (validation), 500.
- **Side effects:** Sets `accessToken`, `refreshToken`, and legacy `token` cookies (httpOnly). Inserts a welcome `Notification`.

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"name":"Asha","email":"asha@example.com","password":"hunter2!"}'
```

### POST /api/auth/login

- **Auth:** public
- **Purpose:** Verify credentials and issue tokens.
- **Request body:** `{ email (string, req), password (string, req) }`
- **Response (200):** `{ success: true, user, accessToken }`
- **Errors:** 401 invalid credentials, 500.
- **Side effects:** Sets `accessToken`, `refreshToken`, `token` cookies.

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"asha@example.com","password":"hunter2!"}'
```

### POST /api/auth/logout

- **Auth:** protected
- **Purpose:** Clear authentication cookies on the server side.
- **Request body:** none.
- **Response (200):** `{ success: true, message: "Logged out successfully" }`
- **Side effects:** Clears `accessToken`, `refreshToken`, `token` cookies.

```bash
curl -X POST http://localhost:5000/api/auth/logout -b cookies.txt -c cookies.txt
```

### POST /api/auth/refresh

- **Auth:** public (requires valid `refreshToken` cookie)
- **Purpose:** Exchange a non-expired refresh token for a fresh access token.
- **Request body:** none. Reads `refreshToken` from cookie.
- **Response (200):** `{ success: true }`
- **Errors:** 401 if cookie missing or token invalid/expired.
- **Side effects:** Sets `accessToken` and legacy `token` cookies.

```bash
curl -X POST http://localhost:5000/api/auth/refresh -b cookies.txt -c cookies.txt
```

### GET /api/auth/me

- **Auth:** protected
- **Purpose:** Return the currently authenticated user.
- **Response (200):** `{ success: true, user }`
- **Errors:** 401.

```bash
curl http://localhost:5000/api/auth/me -b cookies.txt
```

### POST /api/auth/social

- **Auth:** public
- **Purpose:** Federated login from a Google/GitHub OAuth callback handled client-side.
- **Request body:** `{ email (string, req), name (string, req), avatar (string, opt), provider (string, req), providerId (string, req) }`
- **Response (200):** `{ success: true, user, accessToken }`
- **Errors:** 400, 500.
- **Side effects:** Creates the user if absent, issues tokens, sends a welcome notification on first sign-in.

```bash
curl -X POST http://localhost:5000/api/auth/social \
  -H "Content-Type: application/json" -c cookies.txt \
  -d '{"email":"asha@example.com","name":"Asha","provider":"google","providerId":"abc123"}'
```

### POST /api/auth/forgot-password

- **Auth:** public
- **Purpose:** Issue a reset token and email a reset link.
- **Request body:** `{ email (string, req) }`
- **Response (200):** `{ success: true, message: "If an account exists, a reset link has been sent." }` — intentionally generic to avoid leaking account existence.
- **Side effects:** Sets hashed `resetPasswordToken` + `resetPasswordExpire` (30 minutes) on the user. Sends an email if SMTP is configured.

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"asha@example.com"}'
```

### PUT /api/auth/reset-password/:resetToken

- **Auth:** public (token-bearing URL)
- **Purpose:** Complete a password reset.
- **Request body:** `{ password (string, req, min 6) }`
- **Response (200):** `{ success: true, user, accessToken }`
- **Errors:** 400 token expired/invalid, 500.
- **Side effects:** Clears reset token, issues fresh tokens, creates an in-app notification.

```bash
curl -X PUT http://localhost:5000/api/auth/reset-password/RESET_TOKEN_FROM_EMAIL \
  -H "Content-Type: application/json" \
  -d '{"password":"newSecret9!"}'
```

### PUT /api/auth/update-password

- **Auth:** protected
- **Purpose:** Change password while logged in.
- **Request body:** `{ currentPassword (string, req), newPassword (string, req, min 6) }`
- **Response (200):** `{ success: true, user, accessToken }`
- **Errors:** 401 wrong current password, 500.
- **Side effects:** Re-issues access cookie.

```bash
curl -X PUT http://localhost:5000/api/auth/update-password \
  -H "Content-Type: application/json" -b cookies.txt -c cookies.txt \
  -d '{"currentPassword":"hunter2!","newPassword":"newSecret9!"}'
```

---

## Users

### PUT /api/users/profile

- **Auth:** protected
- **Purpose:** Update profile fields.
- **Request body:** `{ name (opt), avatar (string url, opt), profile (object, deep-merged) }` where `profile` may include `age, gender, height, weight, bloodGroup, medicalConditions, medications`.
- **Response (200):** `{ success: true, user }`

```bash
curl -X PUT http://localhost:5000/api/users/profile \
  -H "Content-Type: application/json" -b cookies.txt \
  -d '{"profile":{"age":29,"height":172,"weight":68}}'
```

### POST /api/users/profile/avatar

- **Auth:** protected
- **Purpose:** Upload an avatar image (multer; image MIME types only; 10 MB cap).
- **Request body:** multipart/form-data with field `avatar`.
- **Response (200):** `{ success: true, user, avatar: "/uploads/<filename>" }`
- **Side effects:** Writes file under `Backend/uploads/`. Deletes the previous local avatar if any.

```bash
curl -X POST http://localhost:5000/api/users/profile/avatar \
  -F "avatar=@./me.jpg" -b cookies.txt
```

### PUT /api/users/password

- **Auth:** protected
- **Purpose:** Change password (mirror of `PUT /api/auth/update-password` but without re-issuing tokens).
- **Request body:** `{ currentPassword, newPassword (min 6) }`
- **Response (200):** `{ success: true, message: "Password updated successfully" }`

### GET /api/users/notifications

- **Auth:** protected
- **Purpose:** Last 20 notifications.
- **Response (200):** `{ success: true, notifications: [...], unreadCount: number }`

```bash
curl http://localhost:5000/api/users/notifications -b cookies.txt
```

### PUT /api/users/notifications/:id/read

- **Auth:** protected
- **Response (200):** `{ success: true, message: "Notification marked as read" }`
- **Errors:** 404.

### PUT /api/users/notifications/read-all

- **Auth:** protected
- **Response (200):** `{ success: true, message: "All notifications marked as read" }`

### POST /api/users/bookmarks/:blogId

- **Auth:** protected
- **Purpose:** Toggle a blog bookmark.
- **Response (200):** `{ success: true, bookmarked: boolean, bookmarkedBlogs: [ObjectId] }`

### GET /api/users/bookmarks

- **Auth:** protected
- **Response (200):** `{ success: true, bookmarks: [Blog] }` (populated).

---

## Health Data

### POST /api/health-data

- **Auth:** protected
- **Purpose:** Insert a daily health-data record.
- **Request body:**
  ```json
  {
    "vitals":   { "heartRate": 72, "bloodPressure": { "systolic": 120, "diastolic": 80 }, "bloodSugar": 95, "oxygenLevel": 98, "temperature": 36.7, "weight": 68 },
    "activity": { "steps": 8200, "caloriesBurned": 280, "activeMinutes": 35, "distance": 6.1 },
    "waterIntake": 2.1,
    "sleep":    { "duration": 7.5, "quality": "good", "bedtime": "23:30", "wakeTime": "07:00" },
    "healthScore": 84,
    "mood": "good",
    "notes": "felt great"
  }
  ```
  All fields optional; the controller fills in defaults from the [HealthData schema](../Backend/models/HealthData.js).
- **Response (201):** `{ success: true, data }`

```bash
curl -X POST http://localhost:5000/api/health-data \
  -H "Content-Type: application/json" -b cookies.txt \
  -d '{"vitals":{"heartRate":72},"activity":{"steps":8200},"waterIntake":2.1}'
```

### GET /api/health-data/today

- **Auth:** protected
- **Response (200):** `{ success: true, data: HealthData | <empty defaults> }`

### PUT /api/health-data/today

- **Auth:** protected
- **Purpose:** Upsert today's record (deep merge).
- **Request body:** same shape as `POST /api/health-data`.
- **Response (200):** `{ success: true, data }`

### GET /api/health-data/weekly

- **Auth:** protected
- **Query:** `days` (int, default 7).
- **Response (200):** `{ success: true, data: [{ name, score, heart, steps, water, sleep, date }] }`

```bash
curl "http://localhost:5000/api/health-data/weekly?days=7" -b cookies.txt
```

### GET /api/health-data/monthly

- **Auth:** protected
- **Response (200):** `{ success: true, summary: { avgHealthScore, avgHeartRate, avgSteps, avgWaterIntake, avgSleep, totalDays } }`

### GET /api/health-data/dashboard

- **Auth:** protected
- **Response (200):** `{ success: true, stats: { daily, coins, weeklyTrends, stepsChange } }`

### POST /api/health-data/reports

- **Auth:** protected
- **Purpose:** Upload a medical report (PDF/DOCX/image; 10 MB cap).
- **Request body:** multipart/form-data with field `report` plus optional `title, type, doctorName, labName, reportDate, notes`.
- **Response (201):** `{ success: true, report }`

```bash
curl -X POST http://localhost:5000/api/health-data/reports \
  -F "report=@./blood-test.pdf" -F "title=Blood test" -F "type=blood_test" \
  -b cookies.txt
```

### GET /api/health-data/reports

- **Auth:** protected
- **Response (200):** `{ success: true, reports: [MedicalReport] }`

---

## Risk Prediction

### POST /api/risk-prediction/analyze

- **Auth:** protected
- **Purpose:** Run the cardiovascular / diabetes / stroke risk model and persist the result.
- **Request body:**
  ```json
  {
    "age": 32,
    "gender": "Male",
    "bloodPressure": "120/80",
    "cholesterol": 190,
    "bloodSugar": 95,
    "bmi": 24.1,
    "smokingStatus": "Never",
    "exerciseFrequency": "3-4 times/week",
    "familyHistory": "None"
  }
  ```
- **Response (201):**
  ```json
  {
    "success": true,
    "prediction": {
      "overallRisk": "low",
      "heartDiseaseRisk": 12,
      "diabetesRisk": 8,
      "strokeRisk": 4,
      "bpRisk": 5,
      "summary": "...",
      "recommendations": ["..."],
      "recommendedDoctors": [{ "name": "...", "specialty": "cardiologist", "distance": "...", "rating": 4.7 }],
      "dietPlan": "...",
      "workoutPlan": "..."
    }
  }
  ```
- **Side effects:** Persists a `RiskPrediction`, queues a notification, may call Groq for refinement.

### GET /api/risk-prediction/history

- **Auth:** protected
- **Query:** `all` (boolean), `limit` (int 1–500, default 10).
- **Response (200):** `{ success: true, predictions: [...] }`

### GET /api/risk-prediction/latest

- **Auth:** protected
- **Response (200):** `{ success: true, prediction }`

---

## Chatbot

### POST /api/chatbot/message

- **Auth:** protected
- **Purpose:** Send a turn to the health or medicine chatbot.
- **Request body:** `{ message (string, req), botType ("health" | "medicine"), sessionId (string, opt) }`
- **Response (200):** `{ success: true, response: string, sessionId: string }`
- **Side effects:** Creates or appends to a `ChatSession`. Calls OpenAI; falls back to a static response if the key is missing.

```bash
curl -X POST http://localhost:5000/api/chatbot/message \
  -H "Content-Type: application/json" -b cookies.txt \
  -d '{"message":"how do I lower my resting heart rate?","botType":"health"}'
```

### GET /api/chatbot/sessions

- **Auth:** protected
- **Query:** `botType` (optional filter).
- **Response (200):** `{ success: true, sessions: [{ _id, title, botType, createdAt, updatedAt }] }`

### GET /api/chatbot/sessions/:sessionId

- **Auth:** protected
- **Response (200):** `{ success: true, session: { ..., messages: [...] } }`
- **Errors:** 404.

### DELETE /api/chatbot/sessions/:sessionId

- **Auth:** protected
- **Response (200):** `{ success: true, message: "Chat session deleted" }`

### POST /api/chatbot/explain-medicine

- **Auth:** protected
- **Purpose:** Look up a drug via openFDA + RxNav and check for interactions against the user's known medications.
- **Request body:** `{ name (string, req), userMedications (string[], opt) }`
- **Response (200):**
  ```json
  {
    "success": true,
    "status": "ok",
    "medicine": {
      "name": "Atorvastatin",
      "genericName": "atorvastatin calcium",
      "rxcui": "83367",
      "drugClass": "HMG-CoA Reductase Inhibitor",
      "uses": "...",
      "dosage": "...",
      "sideEffects": "...",
      "warnings": "...",
      "interactions": "...",
      "contraindications": "...",
      "matchedInteractions": []
    },
    "disclaimer": "Educational use only..."
  }
  ```
- **Errors:** 404 `{ success: false, status: "not-found" }`, 500.

### POST /api/chatbot/nearby-doctors

- **Auth:** protected
- **Purpose:** Find doctors of a given specialty within a radius. Hits the seeded `Doctor` collection (Mongo `$geoNear`); falls back to OpenStreetMap Overpass when results are sparse.
- **Request body:** `{ specialty (string, req), lat (number), lon (number), city (string), radius (int, meters, default 7000) }` — provide either `lat`+`lon` or `city`.
- **Response (200):** `{ success: true, status: "ok", location, specialty, radius, doctors: [...], sources: ["db" | "osm"], disclaimer }`
- **Errors:** 400 missing inputs, 500.

```bash
curl -X POST http://localhost:5000/api/chatbot/nearby-doctors \
  -H "Content-Type: application/json" -b cookies.txt \
  -d '{"specialty":"cardiologist","city":"Mumbai"}'
```

### POST /api/chatbot/geocode

- **Auth:** protected
- **Purpose:** Resolve a city name or lat/lon pair to canonical coordinates.
- **Request body:** `{ city (string, opt), lat (number, opt), lon (number, opt) }` — at least one required.
- **Response (200):** `{ success: true, status: "ok", lat, lon, name }`
- **Errors:** 404 `{ status: "not-found" }`, 500.

### POST /api/chatbot/analyze-report/:reportId

- **Auth:** protected
- **Purpose:** Send a previously uploaded `MedicalReport` (PDF/DOCX) text to Groq for structured analysis.
- **Response (200):** `{ success: true, status, summary, conditions, recommendations, ... }`
- **Errors:** 404 report not found / not owner, 500 LLM unavailable.

```bash
curl -X POST http://localhost:5000/api/chatbot/analyze-report/REPORT_ID \
  -b cookies.txt
```

---

## Body Explorer

All endpoints public.

### GET /api/body-explorer

- **Query:** `search` (string), `system` (string), `gender` ("male" | "female").
- **Response (200):** `{ success: true, data: { [partName]: {...meta} }, totalParts: number }`

```bash
curl "http://localhost:5000/api/body-explorer?system=cardiac"
```

### GET /api/body-explorer/:partName

- **Response (200):** `{ success: true, data: { ...partInfo }, partName: string }`. Falls back to a generic stub when the part is unknown.

### GET /api/body-explorer/meta/systems

- **Response (200):** `{ success: true, systems: [{ id, label }] }`

---

## Goals

### GET /api/goals

- **Auth:** protected
- **Query:** `status` ("active" | "completed").
- **Response (200):** `{ success: true, goals: [Goal] }`

### POST /api/goals

- **Auth:** protected
- **Request body:** `{ title (string, req), type (string, req), current (number), target (number), unit (string, opt), startDate, endDate, isCompleted (bool) }`
- **Response (201):** `{ success: true, goal }`
- **Side effects:** Creates a "Goal added" notification.

```bash
curl -X POST http://localhost:5000/api/goals \
  -H "Content-Type: application/json" -b cookies.txt \
  -d '{"title":"10k steps daily","type":"steps","current":0,"target":10000,"unit":"steps"}'
```

### PUT /api/goals/:id

- **Auth:** protected
- **Request body:** any of `current, target, isCompleted`.
- **Response (200):** `{ success: true, goal }` or 404.
- **Side effects:** Crosses 25/50/75/100% milestones generate notifications.

### POST /api/goals/:id/progress

- **Auth:** protected
- **Purpose:** Append a daily progress entry (cap of 7 retained).
- **Request body:** `{ value (number, req) }`
- **Response (200):** `{ success: true, goal }`

### DELETE /api/goals/:id

- **Auth:** protected
- **Response (200):** `{ success: true, message: "Goal deleted" }`

### GET /api/goals/suggestions

- **Auth:** protected
- **Response (200):** `{ success: true, suggestions: [{ text, priority }], estimatedCompletion: "YYYY-MM-DD", overallProgress: number }`

---

## Walk & Earn

Mounted at both `/api/walk-earn` and `/api/walkearn` (alias). All endpoints protected.

### POST /api/walk-earn/log-steps

- **Request body:** `{ steps (int, req) }`
- **Response (200):** `{ success: true, todaySteps, todayCoins, totalCoins, dailyGoal, stepsRemaining }`
- **Side effects:** Increments `user.coins` and `user.totalStepsAllTime`. Coin rate: 10 coins per 1000 steps (1 per 100).

```bash
curl -X POST http://localhost:5000/api/walk-earn/log-steps \
  -H "Content-Type: application/json" -b cookies.txt \
  -d '{"steps":2400}'
```

### GET /api/walk-earn/summary

- **Response (200):** `{ success: true, totalCoins, todaySteps, dailyGoal, todayCoins, weeklyData: [{ date, steps, coins }], totalStepsAllTime }`

### GET /api/walk-earn/stats

- Alias of `summary`.

### GET /api/walk-earn/rewards

- **Response (200):** `{ success: true, rewards: [{ ...Reward, canRedeem: boolean }], userCoins }`

### POST /api/walk-earn/redeem/:rewardId

- **Response (200):** `{ success: true, message, remainingCoins, redemption }`
- **Errors:** 400 insufficient coins / out of stock, 404.
- **Side effects:** Deducts coins, decrements `Reward.stock` (unless unlimited), creates a `Redemption` and a notification.

### GET /api/walk-earn/redemptions

- **Response (200):** `{ success: true, redemptions: [Redemption] }`

---

## Forecast

All endpoints protected.

### GET /api/forecast

- **Query:** `lat`, `lon`, `city` (provide either lat+lon or city).
- **Response (200):**
  ```json
  {
    "success": true,
    "forecast": {
      "temperature": 31, "temperatureUnit": "C",
      "condition": "Clear",
      "humidity": 62, "windSpeed": 12,
      "airQuality": { "aqi": 78, "category": "moderate" },
      "uvIndex": 7, "pollenLevel": "low",
      "activities": ["..."], "healthTips": ["..."],
      "location": "Mumbai, IN",
      "lastUpdated": "<ISO>"
    }
  }
  ```
- **Errors:** 400 missing inputs, 502 upstream weather error.

```bash
curl "http://localhost:5000/api/forecast?city=Mumbai" -b cookies.txt
```

### GET /api/forecast/weekly

- **Query:** `lat`, `lon`, `city`.
- **Response (200):** `{ success: true, forecast: [{ day, date, temp, maxTemp, minTemp, condition, humidity, rainChance, precipitationMm, bestActivity, healthScore, isToday }] }`

---

## Blogs

### GET /api/blogs

- **Auth:** public
- **Query:** `category` (string), `search` (string), `page` (int, default 1), `limit` (int, default 10).
- **Response (200):** `{ success: true, blogs: [Blog], pagination: { total, page, pages } }`

### GET /api/blogs/:identifier

- **Auth:** public
- **Purpose:** Fetch by slug or ObjectId.
- **Response (200):** `{ success: true, blog }`
- **Side effects:** Increments `blog.views`.
- **Errors:** 404.

### GET /api/blogs/trending

- **Auth:** public
- **Response (200):** `{ success: true, blogs: [...] }` — top 5 by `isPopular` then `views`.

### GET /api/blogs/categories

- **Auth:** public
- **Response (200):** `{ success: true, categories: ["All", "Technology", "Wellness", ...] }`

### POST /api/blogs

- **Auth:** admin
- **Request body:** `{ title (req), excerpt, content (req), category, tags, image, readTime, isPublished, isPopular, author: { name, avatar, designation } }` — `slug` and `readTime` auto-derived if omitted.
- **Response (201):** `{ success: true, blog }`

### PUT /api/blogs/:id

- **Auth:** admin
- **Response (200):** `{ success: true, blog }` or 404.

### DELETE /api/blogs/:id

- **Auth:** admin
- **Response (200):** `{ success: true, message: "Blog deleted" }`

### POST /api/blogs/:id/like

- **Auth:** protected
- **Response (200):** `{ success: true, likes: number }`

---

## Contact

### POST /api/contact

- **Auth:** public
- **Request body:** `{ firstName, lastName, name (opt — fallback combined), email (req), message (req) }`
- **Response (201):** `{ success: true, message, emailDelivered: boolean, contact }`
- **Side effects:** Inserts a `Contact`, emails the user a confirmation, copies the admin address.

### POST /api/contact/ticket

- **Auth:** protected
- **Request body:** multipart/form-data — `fullName, email, subject (opt), message (req)` and `attachments` (file[], up to 5).
- **Response (201):** `{ success: true, message: "Support ticket #XXXXXX submitted...", ticket }`
- **Side effects:** Creates a `SupportTicket`, sends an in-app notification, emails user + admin.

```bash
curl -X POST http://localhost:5000/api/contact/ticket \
  -F "fullName=Asha" -F "email=asha@example.com" \
  -F "message=Cannot upload my report." \
  -F "attachments=@./screenshot.png" -b cookies.txt
```

### GET /api/contact/tickets

- **Auth:** protected
- **Response (200):** `{ success: true, tickets: [SupportTicket] }`

### GET /api/contact/admin/contacts

- **Auth:** admin
- **Response (200):** `{ success: true, contacts: [Contact] }`

### GET /api/contact/admin/tickets

- **Auth:** admin
- **Query:** `status` (optional filter).
- **Response (200):** `{ success: true, tickets: [...] }` (with `user` populated).

### PUT /api/contact/admin/tickets/:id

- **Auth:** admin
- **Request body:** `{ status, adminNotes (opt) }`
- **Response (200):** `{ success: true, ticket }` or 404.
- **Side effects:** Notifies the ticket owner.

---

## Notifications

All endpoints protected.

### GET /api/notifications

- **Query:** `unreadOnly` (boolean).
- **Response (200):** `{ success: true, notifications: [...max 50], unreadCount }`

### POST /api/notifications

- **Request body:** `{ title (req), message (req), type ("health" | "reminder" | "achievement" | "system" | "promotion", default "system"), link (opt), icon (opt) }`
- **Response (201):** `{ success: true, notification }`

### PUT /api/notifications/read-all

- **Response (200):** `{ success: true, message: "All notifications marked as read" }`

### DELETE /api/notifications/clear-all

- **Response (200):** `{ success: true, message: "All notifications cleared" }`

### POST /api/notifications/water-reminder

- **Request body:** `{ intervalMinutes (int, req) }`
- **Response (201):** `{ success: true, notification, message: "Water reminder set for every X minutes" }`

### POST /api/notifications/activity

- **Request body:** `{ activityType (string, req), message (string, req) }`
- **Response (201):** `{ success: true, notification }`

### PUT /api/notifications/:id/read

- **Response (200):** `{ success: true, notification }` or 404.

### DELETE /api/notifications/:id

- **Response (200):** `{ success: true, message: "Notification deleted" }`

---

## WhatsApp

All endpoints public — they are the entry points for OTP-based auth.

### POST /api/whatsapp/send-login-otp

- **Request body:** `{ whatsappNumber (string, req, intl format) }`
- **Response (200):** `{ success: true, message: "OTP sent...", devOtp? }`. `devOtp` is included **only** when `NODE_ENV !== 'production'`, to ease local testing.
- **Errors:** 400, 404 (no user), 500.
- **Side effects:** Saves a hashed OTP and 5-minute expiry on the User. Calls Meta WhatsApp Cloud API; logs the OTP if no token configured.

### POST /api/whatsapp/verify-login-otp

- **Request body:** `{ whatsappNumber, otp }`
- **Response (200):** `{ success: true, user, accessToken }`
- **Errors:** 401 invalid/expired OTP.
- **Side effects:** Sets cookies (`accessToken`, `refreshToken`, `token`).

### POST /api/whatsapp/send-signup-otp

- **Request body:** `{ name, email, password (min 6), whatsappNumber }`
- **Response (200):** `{ success: true, message, devOtp? }`
- **Side effects:** Inserts a `SignupOtp` (15-minute TTL).

### POST /api/whatsapp/verify-signup-otp

- **Request body:** `{ email, otp }`
- **Response (201):** `{ success: true, user, accessToken }`
- **Side effects:** Promotes the `SignupOtp` to a real `User`, deletes the OTP record, sends a welcome notification.

```bash
curl -X POST http://localhost:5000/api/whatsapp/send-login-otp \
  -H "Content-Type: application/json" \
  -d '{"whatsappNumber":"+919999999999"}'
```

---

## SMS

All endpoints public.

### POST /api/sms/send

- **Request body:** `{ to (intl phone, req), message (req) }`
- **Response (200):** `{ success: true, message: "SMS sent successfully.", sms }`
- **Side effects:** Calls Twilio. Returns 500 if Twilio credentials are missing.

### POST /api/sms/test

- **Request body:** `{ to }`
- **Response (200):** `{ success: true, message: "Test SMS sent successfully.", sms }`

### POST /api/sms/send-login-otp

- **Request body:** `{ phoneNumber (intl format) }`
- **Response (200):** `{ success: true, message: "OTP sent on your SMS number." }`
- **Errors:** 404 user not found, 500.

### POST /api/sms/verify-login-otp

- **Request body:** `{ phoneNumber, otp }`
- **Response (200):** `{ success: true, user, accessToken }`
- **Side effects:** Sets cookies.

```bash
curl -X POST http://localhost:5000/api/sms/send-login-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+919999999999"}'
```

---

## Predict

All endpoints protected. Most spawn a Python subprocess via [`Backend/utils/mlPredictor.js`](../Backend/utils/mlPredictor.js); see [ADR-0004](ADRs/0004-ml-subprocess-bridge.md). When Python is unavailable, the controller returns a clear error.

### POST /api/predict/diabetes

- **Request body:** `{ age, glucose, bloodPressure, skinThickness, insulin, bmi, diabetesPedigreeFunction, pregnancies }` (numeric fields the model was trained on; see the Python script for the canonical contract).
- **Response (201):** `{ success: true, prediction: { ... } }`
- **Side effects:** Persists a record; spawns Python; may call OpenAI/Groq for explanation.

### POST /api/predict/heart

- **Request body:** numeric features matching the heart-disease model (e.g. `age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal`).
- **Response (201):** `{ success: true, prediction: {...} }`

### POST /api/predict/all

- **Request body:** combined health metrics.
- **Response (201):** `{ success: true, prediction: { heart, diabetes, bmi } }`

### POST /api/predict/adaptive-questions

- **Purpose:** Generate context-aware follow-up questions for the symptom flow via Groq.
- **Request body:** `{ symptoms: string[], context?: object }`
- **Response (200):** `{ success: true, questions: [{ id, text, options? }] }`

### POST /api/predict/symptoms-disease

- **Purpose:** Predict the most likely disease from a symptom list using the ML model with optional LLM refinement.
- **Request body:** `{ symptoms: string[], contextualAnswers?: object }`
- **Response (201):**
  ```json
  {
    "success": true,
    "prediction": {
      "predictedDisease": "...",
      "confidence": 0.78,
      "topPredictions": [{ "disease": "...", "confidence": 0.78, "reasoning": "..." }],
      "details": { "description": "...", "precautions": ["..."], "medications": ["..."], "diets": ["..."], "workouts": ["..."], "riskFactors": ["..."] },
      "predictionSource": "ensemble",
      "refinementSource": "hybrid",
      "emergencyOverrides": []
    }
  }
  ```

### GET /api/predict/symptoms-history

- **Response (200):** `{ success: true, predictions: [SymptomPrediction] }`

### POST /api/predict/share-whatsapp

- **Purpose:** Send a prediction summary via WhatsApp.
- **Request body:** `{ predictionId? (string), summary? (string), recipient (string, intl format) }`
- **Response (200):** `{ success: true, message: "Shared successfully" }`

### POST /api/predict/share-symptoms-whatsapp

- Same shape as above but for `SymptomPrediction` records.

```bash
curl -X POST http://localhost:5000/api/predict/symptoms-disease \
  -H "Content-Type: application/json" -b cookies.txt \
  -d '{"symptoms":["headache","fatigue","fever"]}'
```

---

## Dashboard

All endpoints protected.

### GET /api/dashboard/summary

- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "healthScore": 84,
      "streakDays": 6,
      "avgScore7d": 81,
      "topGoal": { "title": "10k steps daily", "progress": 72 },
      "todayTotals": { "steps": 8200, "water": 2.1, "sleep": 7.5 },
      "nextAction": "Log your evening water intake"
    }
  }
  ```

### GET /api/dashboard/trends

- **Query:** `range` ("7d" | "30d", default "7d").
- **Response (200):** `{ success: true, days: [{ date, label, stepsPct, waterPct, goalsPct, healthScore }] }`

### GET /api/dashboard/insights

- **Purpose:** AI-generated or rule-based insights, cached for 15 minutes per user.
- **Response (200):** `{ success: true, insights: [{ icon, severity, title, body }], source: "llm" | "rules", cached: boolean }`

```bash
curl http://localhost:5000/api/dashboard/insights -b cookies.txt
```

---

## Notes for consumers

- All list endpoints sort by `createdAt` descending unless documented otherwise.
- File uploads use `multer` with a 10 MB cap. Allowed MIME types vary per endpoint; check the controller for details.
- `userMedications` (medicine-explainer), `bookmarkedBlogs` (user), and `medicalConditions` / `medications` (profile) are arrays of free-form strings persisted on the User document.
- The frontend's axios instance ([Frontend/src/services/api.js](../Frontend/src/services/api.js)) automatically retries `429` with backoff and refreshes on `401`. Server-side, the global rate limiter keys on IP and is in-memory (single-instance only).
