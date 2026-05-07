# Environment Setup Guide

A click-by-click walkthrough for every environment variable HealanceAI-Orbit needs. Written for people who have **never used these provider websites before** — every step tells you exactly which page to open, which button to click, what the value should look like, and where to paste it.

If you only need a quick overview, see [SETUP.md](SETUP.md). If you get stuck on a specific provider, this is the document for you.

**Time estimate:** ~10 minutes for the minimum setup, ~45 minutes if you want every optional integration working.

---

## Table of contents

1. [Before you start](#1-before-you-start)
2. [The 5-minute minimum setup](#2-the-5-minute-minimum-setup) — the smallest set of variables that lets the backend start.
3. [Optional integrations](#3-optional-integrations) — every external provider (OpenAI, Groq, Twilio, WhatsApp, email, weather).
4. [Variables with safe defaults](#4-variables-with-safe-defaults) — leave alone unless you have a reason.
5. [Frontend variables](#5-frontend-variables)
6. [ML service (`ML_SERVICE_URL`, `ML_SERVICE_TOKEN`, `ML_TIMEOUT_MS`)](#6-ml-service-ml_service_url-ml_service_token-ml_timeout_ms)
7. [Putting it all together](#7-putting-it-all-together) — a complete annotated `.env`.
8. [Verification checklist](#8-verification-checklist)
9. [Troubleshooting](#9-troubleshooting)
10. [Security reminders](#10-security-reminders)

---

## 1. Before you start

### What you need installed

| Tool | Version | Why |
|---|---|---|
| **Node.js** | 20.x | Runs the backend and frontend. Download: https://nodejs.org/en/download |
| **npm** | 10+ | Comes with Node.js. |
| **MongoDB** | 6.x+ *or* a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) account | Database. |
| **Git** | any | To clone the repo. |
| **A code editor** | any | VS Code is fine. |

Check that Node is installed (open a terminal and type):

```bash
node --version
# Should print: v20.x.x
```

If you see something like `v18.x` or "command not found", install Node 20 first.

### Create your `.env` files

The repo ships **template** files that list every variable with example values. You need to **copy** these templates into real `.env` files (which Git ignores) and fill them in.

```bash
# From the repo root:
cp Backend/.env.example Backend/.env
cp Frontend/.env.example Frontend/.env
```

> On Windows PowerShell, `cp` works the same way. If it doesn't, use `Copy-Item Backend/.env.example Backend/.env`.

Now open both new `.env` files in your editor. You'll edit them as you go through this guide.

> ⚠️ **Never commit `.env` files.** They contain secrets. The repo's `.gitignore` already excludes them — keep it that way.

---

## 2. The 5-minute minimum setup

These five variables are the smallest set you need to start the backend. Every other integration in this document is optional.

| Variable | Required? | What breaks without it |
|---|---|---|
| `MONGO_URI` | Yes | Backend cannot start. |
| `JWT_SECRET` | Yes | Login/signup fails. |
| `JWT_REFRESH_SECRET` | Yes | Auto re-login (refresh tokens) fails. |
| `CLIENT_URL` | Yes for full app | CORS blocks the frontend; password-reset emails point to the wrong URL. |
| `PORT` | Has default `5000` | Only change if 5000 is taken. |

---

### `MONGO_URI`

**Purpose:** Connection string telling the backend which MongoDB database to use.
**Where it's used:** [Backend/config/db.js](../Backend/config/db.js)
**Cost:** Free (Atlas has a free M0 tier; local install is free).

You have **two options** — pick one.

#### Option A — MongoDB Atlas (cloud, easiest, recommended for first-time setup)

1. Open https://www.mongodb.com/cloud/atlas/register in your browser.
2. Sign up with your email or Google account.
3. Click **"Create"** when asked which deployment to set up.
4. Choose **"M0 FREE"** (it's the first card, labeled "Shared"). Click **"Create Deployment"**.
5. A modal appears titled **"Connect to your cluster"**. It asks you to create a database user:
   - Username: `healance` (or anything you like)
   - Password: click **"Autogenerate Secure Password"** and **copy the password somewhere safe** — you cannot see it again.
   - Click **"Create Database User"**.
6. Below that, under **"Where would you like to connect from?"**, click **"Add My Current IP Address"**, then **"Finish and Close"**.
7. You'll land on the cluster page. Click the **"Connect"** button on your cluster.
8. Click **"Drivers"** (the icon labeled "Connect your application").
9. You'll see a connection string that looks like:
   ```
   mongodb+srv://healance:<db_password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
10. **Copy this string.** Replace `<db_password>` with the password you saved in step 5. Add `/healance_ai` right before the `?`:
    ```
    mongodb+srv://healance:YOURPASSWORD@cluster0.abcde.mongodb.net/healance_ai?retryWrites=true&w=majority&appName=Cluster0
    ```
11. Open `Backend/.env` and paste it after `MONGO_URI=`:
    ```env
    MONGO_URI=mongodb+srv://healance:YOURPASSWORD@cluster0.abcde.mongodb.net/healance_ai?retryWrites=true&w=majority&appName=Cluster0
    ```

#### Option B — Local MongoDB

1. Open https://www.mongodb.com/try/download/community.
2. Pick your operating system, download, and run the installer (accept defaults).
3. After install, MongoDB runs as a service automatically on macOS/Windows. On Linux, run `sudo systemctl start mongod`.
4. In `Backend/.env`, paste the default URI (already in `.env.example`):
   ```env
   MONGO_URI=mongodb://localhost:27017/healance_ai
   ```

#### Verify it works

Start the backend (`cd Backend && npm install && npm run dev`). Look for this line in the terminal:

```
✓ MongoDB connected
```

If you see `MongoServerError: bad auth`, the password is wrong (Option A) or you forgot to URL-encode special characters in it.

---

### `JWT_SECRET`

**Purpose:** A secret string used to sign login tokens (JWTs). Anyone who knows this secret can forge logins for any user — keep it secret and long.
**Where it's used:** [Backend/middleware/authMiddleware.js](../Backend/middleware/authMiddleware.js), [Backend/utils/generateToken.js](../Backend/utils/generateToken.js)
**Cost:** Free (you generate it yourself).

#### Step-by-step

1. Open a terminal anywhere.
2. Run this single command — it works on Windows, macOS, and Linux as long as Node is installed:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
3. The terminal prints a long hex string (128 characters). Example:
   ```
   8f3a9b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a
   ```
4. Open `Backend/.env` and paste it after `JWT_SECRET=`:
   ```env
   JWT_SECRET=8f3a9b2c1d4e5f...0e9f0a
   ```

> ℹ️ **Why so long?** Short secrets (`mysecret`, `password123`) can be brute-forced. 64 random bytes is the recommended minimum.

#### Verify it works

After starting the backend, sign up a user via the frontend or `curl`:

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"Pass1234!"}'
```

If `JWT_SECRET` is missing or empty, the response will include `"error": "secretOrPrivateKey must have a value"`.

---

### `JWT_REFRESH_SECRET`

**Purpose:** A **second** secret used to sign refresh tokens (which silently re-issue access tokens so users don't have to log in every 15 minutes). Must be different from `JWT_SECRET`.
**Where it's used:** [Backend/controllers/authController.js](../Backend/controllers/authController.js), [Backend/utils/generateToken.js](../Backend/utils/generateToken.js)

#### Step-by-step

1. Run the **same command as above, again**, to get a fresh different value:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
2. Paste the new value after `JWT_REFRESH_SECRET=` in `Backend/.env`.

> ⚠️ Do **not** copy/paste the same value as `JWT_SECRET`. If both secrets are the same, an attacker who steals an access token could mint refresh tokens (or vice versa).

---

### `CLIENT_URL`

**Purpose:** The exact URL where your frontend runs. The backend uses this to:
- decide which origins are allowed to call the API (CORS),
- build links inside password-reset and welcome emails.

**Where it's used:** [Backend/server.js](../Backend/server.js) (CORS config), [Backend/controllers/authController.js](../Backend/controllers/authController.js) (email links)

#### Step-by-step

1. For local development, use the Vite dev-server default:
   ```env
   CLIENT_URL=http://localhost:5173
   ```
2. For production, replace with your deployed frontend URL — for example:
   ```env
   CLIENT_URL=https://app.healance.com
   ```
3. **No trailing slash.** `https://app.healance.com/` (with slash) will mismatch and CORS will reject requests.

#### Verify it works

Start backend and frontend. Open the frontend in your browser. Open DevTools → Network tab → make any API call (e.g. log in). If `CLIENT_URL` is wrong, the browser console shows:

```
Access to fetch at 'http://localhost:5000/api/...' from origin 'http://localhost:5173'
has been blocked by CORS policy.
```

---

### `PORT`

**Purpose:** The TCP port the Express server listens on.
**Default:** `5000` (already in `.env.example`).

You only need to change this if port 5000 is taken by another app.

#### Step-by-step (only if needed)

1. Pick another free port, for example `5001`.
2. Set in `Backend/.env`:
   ```env
   PORT=5001
   ```
3. **Also update `Frontend/.env`** so the frontend talks to the new port:
   ```env
   VITE_API_URL=http://localhost:5001/api
   ```

#### Verify it works

After `npm run dev`, the terminal shows:

```
Server running on port 5001
```

---

## 3. Optional integrations

Each section is fully self-contained. Skip any provider you don't plan to use — the app handles missing keys gracefully (chatbot falls back to a static response, SMS endpoints return a configuration error, etc.).

> ℹ️ **General rule:** every API key on this list is a **secret**. Never paste it into a screenshot, commit it to Git, or share it in Slack/Discord.

---

### `OPENAI_API_KEY`

**Purpose:** Powers the health/medicine chatbot and the dashboard's "Smart Insights" panel.
**Required?** Optional — without it, the chatbot returns a static knowledge-base response.
**Where it's used:** [Backend/controllers/chatbotController.js](../Backend/controllers/chatbotController.js), [Backend/controllers/dashboardController.js](../Backend/controllers/dashboardController.js)
**Cost:** Pay-as-you-go (typically a few cents per chatbot conversation). Requires a minimum credit deposit.

#### Step-by-step

1. Open https://platform.openai.com/signup.
2. Sign up with your email and verify it via the link OpenAI emails you.
3. Verify your phone number when prompted (required by OpenAI).
4. Once logged in, click your profile icon (top-right) → **"Your profile"** → **"Billing"** in the left sidebar.
5. Click **"Add payment details"**, enter a card, then **"Add to credit balance"**. Add at least **$5** (you can set this as a one-time top-up).
6. In the left sidebar, click **"API keys"** (or open https://platform.openai.com/api-keys directly).
7. Click **"+ Create new secret key"** (top-right of the page).
8. Name it something like `Healance` and click **"Create secret key"**.
9. A modal shows your key, starting with `sk-...`. **Click the copy icon — this is the only time you can see it.**
10. In `Backend/.env`, paste it:
    ```env
    OPENAI_API_KEY=sk-proj-abc123...xyz
    ```
11. Save the file and restart the backend (`Ctrl+C`, then `npm run dev`).

#### Verify it works

```bash
curl -X POST http://localhost:5000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message":"What is hypertension?"}'
```

A real OpenAI response is a few sentences of detailed medical-style text. The static fallback is a single short paragraph — if you see the latter, the key isn't being read.

#### Troubleshooting

- `401 Incorrect API key provided` → the key has a trailing space, or you copied an old key. Generate a new one.
- `429 You exceeded your current quota` → your credit balance is empty. Top up under Billing.

---

### `GROQ_API_KEY`

**Purpose:** Powers medical report analysis (PDF/image uploads), adaptive symptom questions, and disease-prediction refinement. Groq runs Meta's Llama models very fast.
**Required?** Optional — without it, report analysis returns "feature unavailable".
**Where it's used:** [Backend/utils/groqClient.js](../Backend/utils/groqClient.js), [Backend/utils/reportAnalyzer.js](../Backend/utils/reportAnalyzer.js), [Backend/controllers/predictController.js](../Backend/controllers/predictController.js)
**Cost:** **Free tier** — no credit card required. Limited to ~30 requests/minute (the backend self-throttles to 28).

#### Step-by-step

1. Open https://console.groq.com/login.
2. Click **"Continue with Google"** or **"Continue with GitHub"** to sign up. (Email signup also works.)
3. Once on the dashboard, look at the left sidebar and click **"API Keys"**.
4. Click the **"Create API Key"** button (top-right).
5. In the modal, give it a name like `Healance` and click **"Submit"**.
6. The key is shown once, starting with `gsk_...`. **Click the copy icon now.**
7. Open `Backend/.env` and paste:
   ```env
   GROQ_API_KEY=gsk_abc123...xyz
   ```
8. Save and restart the backend.

#### Verify it works

Upload a medical report through the frontend (`/dashboard/report-analyzer`) or directly:

```bash
curl -X POST http://localhost:5000/api/reports/analyze \
  -H "Authorization: Bearer YOUR_LOGIN_TOKEN" \
  -F "file=@sample-report.pdf"
```

A successful response includes a `summary` field with a multi-sentence analysis. If the key is missing, you'll see `"feature unavailable"`.

#### Troubleshooting

- `401 Invalid API Key` → key is wrong or expired. Regenerate.
- `429 Rate limit exceeded` → you hit ~30 req/min. Wait a minute, or reduce request frequency.

---

### `GEMINI_API_KEY`

**Purpose:** Listed in `.env.example` as a future fallback LLM (Google Gemini). **Currently not used by any code path** — safe to leave blank.
**Required?** No.
**Cost:** Free tier — 1500 requests/day.

#### Step-by-step (only if you want to set it up early)

1. Open https://aistudio.google.com/app/apikey.
2. Sign in with your Google account.
3. Click **"Create API key"** (blue button).
4. Choose **"Create API key in new project"**.
5. Copy the key shown (starts with `AIza...`).
6. In `Backend/.env`:
   ```env
   GEMINI_API_KEY=AIzaSyABC...xyz
   ```

> ℹ️ Setting this today won't break anything, but no feature will use it until the codebase wires it in.

---

### `OPENWEATHER_API_KEY` (and `WEATHER_API_KEY`)

**Purpose:** Powers the health-forecast widget that correlates weather with vital trends.
**Required?** Optional — `/api/forecast` returns an error without it.
**Where it's used:** [Backend/controllers/forecastController.js](../Backend/controllers/forecastController.js)
**Cost:** Free tier — 1000 calls/day, 60 calls/minute.

> ℹ️ `WEATHER_API_KEY` is the legacy name; `OPENWEATHER_API_KEY` is the current name. Set **either one** — the backend checks both.

#### Step-by-step

1. Open https://home.openweathermap.org/users/sign_up.
2. Fill the form, agree to terms, click **"Create Account"**.
3. Check your email and click the activation link.
4. Log in. Click your username (top-right) → **"My API keys"**.
5. A default key is already created. Click the copy icon next to it.
6. In `Backend/.env`:
   ```env
   OPENWEATHER_API_KEY=abc123def456...
   ```
7. Save and restart.

> ⚠️ **OpenWeather keys take ~10 minutes to activate.** If verification fails immediately after creation, wait and try again.

#### Verify it works

```bash
curl "http://localhost:5000/api/forecast?lat=19.07&lon=72.87"
```

Returns weather JSON. If the key is wrong: `{"error":"invalid api key"}`.

---

### Email — `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `ADMIN_EMAIL`

**Purpose:** Sends welcome emails, password-reset emails, and contact-form confirmations through Gmail's SMTP server.
**Required?** Optional — if missing, the contact form still saves the message but returns `"emailDelivered": false`.
**Where it's used:** [Backend/utils/sendEmail.js](../Backend/utils/sendEmail.js), [Backend/controllers/contactController.js](../Backend/controllers/contactController.js)
**Cost:** Free with any Gmail account.

> ⚠️ **Never use your real Gmail password.** Use an "App password" — a 16-character code Google issues for one specific app. You can revoke it any time without changing your real password.

#### Step-by-step

1. Open https://myaccount.google.com/security.
2. Under **"How you sign in to Google"**, find **"2-Step Verification"**. If it says "Off", click it and follow the setup (this is required to create app passwords).
3. Once 2-Step is on, open https://myaccount.google.com/apppasswords directly.
4. Where it asks **"App name"**, type `Healance` and click **"Create"**.
5. A yellow box shows a 16-character code like `abcd efgh ijkl mnop`. **Copy it without the spaces** — paste into a temporary note as `abcdefghijklmnop`.
6. Click **"Done"**.
7. Open `Backend/.env` and set all five variables:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-gmail-address@gmail.com
   EMAIL_PASS=abcdefghijklmnop
   ADMIN_EMAIL=your-gmail-address@gmail.com
   ```
   - `EMAIL_USER` — the Gmail address itself.
   - `EMAIL_PASS` — the 16-char app password (NOT your real Gmail password).
   - `ADMIN_EMAIL` — where contact-form messages get forwarded. Can be the same as `EMAIL_USER`.
8. Save and restart.

#### Verify it works

Use the password-reset flow on the frontend (`/login` → "Forgot password"). Enter an account email. You should receive a real email within seconds. If it doesn't arrive:

- Check spam.
- Look at the backend terminal — Nodemailer prints errors verbosely (`535 Authentication failed` means the app password is wrong).

#### Troubleshooting

- `535-5.7.8 Username and Password not accepted` → you used your regular Gmail password. Generate an app password instead.
- "Less secure app access" warnings → app passwords avoid this entirely; if you see this, you're not using one.
- Using a different SMTP provider (SendGrid, AWS SES, etc.)? Replace `EMAIL_HOST`/`EMAIL_PORT` with their values; the rest of the variables work the same.

---

### Twilio — `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

**Purpose:** Sends SMS one-time passwords (OTPs) for phone-number-based login/signup.
**Required?** Optional — `/api/sms/*` endpoints return a configuration error without these.
**Where it's used:** [Backend/utils/sendSms.js](../Backend/utils/sendSms.js)
**Cost:** Twilio gives ~$15 trial credit on signup. After that, ~$0.0075 per SMS to US numbers (varies by country).

> ⚠️ **Trial accounts can only SMS phone numbers you've verified.** This is a Twilio policy to prevent spam, not a config issue. To send to any number, upgrade by adding $20+ credit.

#### Step-by-step

1. Open https://www.twilio.com/try-twilio.
2. Sign up with email, verify your email, then verify your real phone number (Twilio sends you a code).
3. Twilio asks a few setup questions ("What do you want to build?", etc.) — answer "SMS" / "Notifications" / "I'm a developer".
4. You land on the **Console Dashboard**. On the right side, you'll see a panel titled **"Account Info"** with:
   - **Account SID** — starts with `AC...`. Copy it.
   - **Auth Token** — click **"Show"** to reveal, then copy.
5. In the left sidebar, click **"Phone Numbers"** → **"Manage"** → **"Buy a number"** (or use the trial number Twilio gave you on signup, listed under **"Active numbers"**).
6. Pick a number with **SMS** capability checked. The number is shown in `+E.164` format like `+15551234567`.
7. Open `Backend/.env`:
   ```env
   TWILIO_ACCOUNT_SID=ACabc123...
   TWILIO_AUTH_TOKEN=def456...
   TWILIO_PHONE_NUMBER=+15551234567
   ```
8. Save and restart.

#### (Trial only) Verify the recipient phone number

1. In the Twilio Console, sidebar: **"Phone Numbers"** → **"Manage"** → **"Verified Caller IDs"**.
2. Click **"+ Add a new Caller ID"**, enter the phone number you want to text in `+E.164` format, click **"Call me"** or **"Text me"** — Twilio gives you a verification code.
3. Enter the code. The number is now allowed.

#### Verify it works

Trigger SMS login from the frontend with your verified number. The phone receives an SMS with a 6-digit code. If nothing arrives, check the backend logs for Twilio error codes (e.g. `21408 Permission to send SMS has not been enabled` → unverified number on a trial account).

---

### WhatsApp — `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`

**Purpose:** Sends OTPs over WhatsApp instead of SMS.
**Required?** Optional — without it, in non-production environments the OTP is logged to the backend's stderr (look for `devOtp` in the JSON response when `NODE_ENV !== "production"`).
**Where it's used:** [Backend/utils/sendWhatsApp.js](../Backend/utils/sendWhatsApp.js), [Backend/controllers/whatsappController.js](../Backend/controllers/whatsappController.js)
**Cost:** Free for 1000 user-initiated conversations/month. Beyond that, varies by country (~$0.005 per conversation).

This is the most multi-step provider in the guide. The flow has three pieces: create a Meta app, get a temporary token (good for 24 hours of testing), and optionally upgrade to a permanent token.

#### Part A — Create the Meta app

1. Open https://developers.facebook.com/.
2. Click **"Get started"** (top-right) and log in with your Facebook account. Verify your account when prompted.
3. Once logged in, hover over **"My Apps"** (top-right) → click **"Create App"**.
4. Use case: choose **"Other"**, then click **"Next"**.
5. App type: choose **"Business"**, then **"Next"**.
6. App name: `Healance` (or anything). App contact email: yours. Business portfolio: pick or create one. Click **"Create app"**.

#### Part B — Add WhatsApp to the app

1. Inside the app dashboard, scroll to **"Add products to your app"**. Find **"WhatsApp"** and click **"Set up"**.
2. Pick a business portfolio when asked, click **"Continue"**.
3. You're now on the **API Setup** page. Note the test phone number Meta gives you ("From" number) — you cannot change this on the free tier, but it's fine for testing.
4. **Copy these two values from this page:**
   - **Phone number ID** — under "From" — looks like `123456789012345`. This is your `WHATSAPP_PHONE_NUMBER_ID`.
   - **Temporary access token** — at the top, under "Access tokens", click **"Copy"**. Looks like `EAAB...`. Good for 24 hours.
5. Paste into `Backend/.env`:
   ```env
   WHATSAPP_ACCESS_TOKEN=EAAB...
   WHATSAPP_PHONE_NUMBER_ID=123456789012345
   ```
6. Save and restart. Test now (see "Verify it works" below) before tokens expire.

#### Part C — Permanent token (optional but recommended)

The 24-hour token in Part B is fine for testing but expires. For a long-lived token:

1. Open https://business.facebook.com/.
2. Top-left burger menu → **"Business settings"**.
3. Left sidebar → **"Users"** → **"System users"**.
4. Click **"Add"**. Name it `Healance API`, role **"Admin"**, click **"Create system user"**.
5. With the system user selected, click **"Add Assets"**. Pick **"Apps"** → select your Healance app → grant **"Manage app"**, click **"Save"**.
6. Click **"Generate new token"**.
7. App: pick the Healance app. Token expiration: **"Never"**. Permissions: tick `whatsapp_business_messaging` and `whatsapp_business_management`. Click **"Generate token"**.
8. **Copy the token immediately** — it's shown only once. Replace the temporary token in `.env` with this permanent one.

#### Verify it works

In the **API Setup** page, scroll to **"Send and receive messages"**. Add your own WhatsApp number to the **"To"** field as a test recipient (verify it via the code Meta sends).

Trigger WhatsApp login from the frontend, or:

```bash
curl -X POST http://localhost:5000/api/whatsapp/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+15551234567"}'
```

You should receive a WhatsApp message with the OTP. If not:

- `(#190) Invalid OAuth access token` → token expired (Part B is 24h) — regenerate or do Part C.
- `Recipient phone number not in allowed list` → on free/test tier, the recipient must be verified in API Setup.

---

### `FDA_API_KEY` (optional)

**Purpose:** The "Explain medicine" feature uses openFDA. The key is **not currently consumed by any code path** — listed in `.env.example` for future use. Setting it raises the rate limit from 240 requests/minute to 120,000/day.
**Required?** No.

#### Step-by-step (skip unless you specifically need higher FDA rate limits)

1. Open https://open.fda.gov/apis/authentication/.
2. Click **"Sign Up"**.
3. Fill the form, submit. The key arrives by email instantly.
4. Paste in `Backend/.env`:
   ```env
   FDA_API_KEY=your-fda-key
   ```

---

### Cloudinary — `CLOUDINARY_URL`

**Purpose:** Stores user-uploaded files (medical reports, profile avatars, support ticket attachments) in Cloudinary instead of the local `Backend/uploads/` directory. Required because hosts like Render and Heroku have ephemeral filesystems — local uploads disappear on every redeploy.
**Required?** Yes if you want uploads to survive deployments. Without it, the upload middleware will throw on every upload attempt.
**Where it's used:** [Backend/middleware/uploadMiddleware.js](../Backend/middleware/uploadMiddleware.js) (Cloudinary storage adapter), [Backend/utils/textExtractor.js](../Backend/utils/textExtractor.js) (fetches the URL when Groq analyzes a report).
**Cost:** Free tier — 25 monthly credits (≈ 25 GB storage + 25 GB bandwidth). No credit card required.

#### Step-by-step

1. Open https://cloudinary.com/users/register/free.
2. Sign up — email + password is enough; no credit card.
3. Verify your email when Cloudinary mails you the link.
4. You land on the **Dashboard**. Note the **Cloud name** in the top-left "Product Environment" card (e.g. `dvq1kiwqn`).
5. Click **Go to API Keys** (top-right of that card).
6. The API Keys page shows three values:
   - **Cloud name** — already known
   - **API Key** — a 15-digit number
   - **API Secret** — click **Reveal** to show it. Treat this like a database password.
7. Cloudinary also prints a single-string `CLOUDINARY_URL=cloudinary://...` on the same page. Copy that.
8. Paste in `Backend/.env`:
   ```env
   CLOUDINARY_URL=cloudinary://your_api_key:your_api_secret@your_cloud_name
   ```
9. Save and restart the backend (`rs` in nodemon, or Ctrl+C then `npm run dev`).

> ℹ️ **Single string vs three vars:** the SDK accepts either format. `CLOUDINARY_URL` is the recommended one because it's a single secret to manage. If you prefer split vars, use `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` instead — don't set both.

#### Verify it works

Upload a small PDF as a medical report from the frontend, then:

1. Open https://console.cloudinary.com/console/media_library
2. Look in the `healance/uploads/` folder
3. Your file should appear there with a public URL

Or via curl (requires a valid auth token):

```bash
curl -X POST http://localhost:5000/api/health-data/reports \
  -H "Authorization: Bearer <jwt>" \
  -F "report=@sample.pdf" \
  -F "title=Test report" \
  -F "type=blood_test"
```

Inspect the response — the saved report's `file.path` should be a `https://res.cloudinary.com/...` URL.

If you see `Must supply api_key` in the backend logs → `CLOUDINARY_URL` isn't loaded. Re-check `.env` formatting (no spaces, no quotes around the URL) and restart.

---

## 4. Variables with safe defaults

You can leave all of these as-is unless you have a specific reason to change them.

| Variable | Default | When to override |
|---|---|---|
| `NODE_ENV` | `development` | Set to `production` on deployed servers — enables secure cookies and hides error stack traces. |
| `JWT_EXPIRE` | `15m` | Increase (e.g. `1h`) if users complain about session timeouts. |
| `JWT_REFRESH_EXPIRE` | `30d` | Decrease for stricter security (e.g. `7d`). |
| `WEATHER_API_BASE_URL` | `https://api.openweathermap.org/data/2.5` | Don't change unless you're proxying OpenWeather. |
| `WEATHER_UNITS` | `metric` | Set `imperial` for Fahrenheit. |
| `MAX_FILE_SIZE` | `10485760` (10 MB) | Increase for larger medical reports — note: Multer enforces this. |
| `API_RATE_LIMIT_MAX` | `1200` per 15 min | Raise for larger production traffic. |
| `AUTH_RATE_LIMIT_MAX` | `60` per 15 min | Lower for stricter abuse protection; only raise during testing. |

---

## 5. Frontend variables

The frontend reads exactly **one** variable from `Frontend/.env`.

### `VITE_API_URL`

**Purpose:** The base URL of the backend API.
**Default:** `http://localhost:5000/api` (already in `Frontend/.env.example`).
**Where it's used:** [Frontend/src/constants/config.js](../Frontend/src/constants/config.js), and several components.

#### Step-by-step

1. Open `Frontend/.env`.
2. For local development, leave the default:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
3. For production, replace with your deployed backend URL — for example:
   ```env
   VITE_API_URL=https://api.healance.com/api
   ```
4. **No trailing slash.** **Include the `/api` suffix** (the backend mounts all routes under `/api`).

> ⚠️ Vite only picks up env vars at **build time**. After changing `VITE_API_URL`, restart `npm run dev` (or rebuild for production).

#### Verify it works

Open the frontend in your browser, log in. Open DevTools → Network tab. Outgoing requests should go to the URL you set. If they go to the wrong host, the dev server didn't pick up the change — restart it.

---

## 6. ML service (`ML_SERVICE_URL`, `ML_SERVICE_TOKEN`, `ML_TIMEOUT_MS`)

**Purpose:** Address and shared-secret for the standalone Python FastAPI inference service. The backend calls it over HTTP — there is no in-process Python anymore (see [ADR-0005](ADRs/0005-ml-http-service.md)).
**Required?** Yes for `/api/predict/*` and `/api/risk-prediction/analyze` to work.
**Where it's used:** [Backend/utils/mlPredictor.js](../Backend/utils/mlPredictor.js)

### Local development — two paths

**Option A — run the FastAPI service locally** (full parity with prod):

```bash
cd "ML Services02"
pip install -r requirements-dev.txt   # newer Python wheels available
uvicorn app:app --port 8001
```

In `Backend/.env`:

```env
ML_SERVICE_URL=http://localhost:8001
ML_SERVICE_TOKEN=
```

A blank `ML_SERVICE_TOKEN` skips the auth check — fine for local dev.

**Option B — point local backend at the deployed ML** (no Python install needed):

```env
ML_SERVICE_URL=https://healanceai-ml.onrender.com
ML_SERVICE_TOKEN=<the same token configured on Render>
```

### Production

| Variable | Value |
|---|---|
| `ML_SERVICE_URL` | `https://healanceai-ml.onrender.com` (set on Render backend env) |
| `ML_SERVICE_TOKEN` | Long random string. **Must be identical** on both Render services. Generate with `openssl rand -hex 32` or PowerShell `[Convert]::ToHexString((1..32 \| %{ Get-Random -Max 256 }))`. |
| `ML_TIMEOUT_MS` | Optional, default 25000 ms. Increase if Render free-tier cold starts cause client timeouts. |

#### Verify it works

```bash
# Health probe (no auth required)
curl https://healanceai-ml.onrender.com/health
# → {"status":"ok","models_loaded":true}

# A real prediction (requires the token)
curl -X POST https://healanceai-ml.onrender.com/predict/heart-diabetes \
  -H "Content-Type: application/json" \
  -H "X-ML-Service-Token: <token>" \
  -d '{"modelType":"diabetes","features":{"age":50,"glucose":180,"bmi":35}}'
```

A 401 means token mismatch; a 503 means the symptom artifact didn't load (check Render logs).

---

## 7. Putting it all together

A complete, fully-annotated `Backend/.env` for a developer who has set up every integration:

```env
# ─── Server ─────────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ─── MongoDB ────────────────────────────────────────────
MONGO_URI=mongodb+srv://healance:YOURPASSWORD@cluster0.abcde.mongodb.net/healance_ai?retryWrites=true&w=majority

# ─── JWT (generate fresh secrets, never reuse) ─────────
JWT_SECRET=8f3a9b2c1d4e...
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=4a7c3e1f9d2b...
JWT_REFRESH_EXPIRE=30d

# ─── Frontend URL (for CORS + email links) ─────────────
CLIENT_URL=http://localhost:5173

# ─── AI / LLM providers ────────────────────────────────
OPENAI_API_KEY=sk-proj-abc123...
GROQ_API_KEY=gsk_abc123...
GEMINI_API_KEY=                          # optional, currently unused

# ─── FDA (optional, not currently consumed) ────────────
FDA_API_KEY=

# ─── Weather ───────────────────────────────────────────
OPENWEATHER_API_KEY=abc123def456...
WEATHER_API_KEY=
WEATHER_API_BASE_URL=https://api.openweathermap.org/data/2.5
WEATHER_UNITS=metric

# ─── Email (Gmail SMTP — use an app password, NOT real password) ─
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=you@gmail.com
EMAIL_PASS=abcdefghijklmnop
ADMIN_EMAIL=you@gmail.com

# ─── WhatsApp Cloud API ────────────────────────────────
WHATSAPP_ACCESS_TOKEN=EAAB...
WHATSAPP_PHONE_NUMBER_ID=123456789012345

# ─── Twilio SMS ────────────────────────────────────────
TWILIO_ACCOUNT_SID=ACabc123...
TWILIO_AUTH_TOKEN=def456...
TWILIO_PHONE_NUMBER=+15551234567

# ─── File uploads (Cloudinary) ─────────────────────────
CLOUDINARY_URL=cloudinary://your_api_key:your_api_secret@your_cloud_name
MAX_FILE_SIZE=10485760

# ─── ML service (FastAPI) ──────────────────────────────
ML_SERVICE_URL=http://localhost:8001
ML_SERVICE_TOKEN=
ML_TIMEOUT_MS=25000
```

And `Frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 8. Verification checklist

After filling in `.env`, run these checks. Each one isolates a different integration so you know exactly where a problem is.

| # | Check | Command / Action | Expected |
|---|---|---|---|
| 1 | Backend boots | `cd Backend && npm install && npm run dev` | `Server running on port 5000`, `MongoDB connected` |
| 2 | API health | `curl http://localhost:5000/api/health` | `{"status":"ok",...}` |
| 3 | Frontend boots | `cd Frontend && npm install && npm run dev` | Vite at `http://localhost:5173` |
| 4 | Sign up | UI: open frontend → Sign in → "Create account" → submit | Lands on `/dashboard` |
| 5 | OpenAI chatbot | UI: open `/dashboard/chatbot` → ask a health question | Multi-paragraph LLM response (not the static fallback) |
| 6 | Groq report analysis | UI: `/dashboard/report-analyzer` → upload PDF | Summary returned |
| 7 | Email | UI: `/login` → "Forgot password" → enter email | Email arrives |
| 8 | Weather | `curl "http://localhost:5000/api/forecast?lat=19.07&lon=72.87"` | Weather JSON |
| 9 | Twilio SMS | UI: `/login` → SMS option → enter verified number | SMS arrives |
| 10 | WhatsApp | UI: `/login` → WhatsApp option → enter verified number | WhatsApp message arrives |
| 11 | ML prediction | UI: `/dashboard/risk-prediction` → submit form | Risk score returned within seconds |

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Backend exits with `MongooseServerSelectionError` | `MONGO_URI` wrong, password not URL-encoded, IP not whitelisted in Atlas | Re-check the URI; in Atlas → Network Access, add your current IP. |
| `secretOrPrivateKey must have a value` | `JWT_SECRET` empty | Generate a secret as in [§2](#jwt_secret). |
| Browser console: `CORS policy: No 'Access-Control-Allow-Origin'` | `CLIENT_URL` doesn't match the frontend's origin | Set `CLIENT_URL=http://localhost:5173` (no trailing slash); restart backend. |
| Chatbot returns very short generic answers | `OPENAI_API_KEY` missing or invalid | Verify the key on https://platform.openai.com/api-keys and replace. |
| Report analyzer says "feature unavailable" | `GROQ_API_KEY` missing | Add it (see [§3 Groq](#groq_api_key)). |
| Password-reset email never arrives | Used real Gmail password instead of app password | Generate an app password (see [§3 Email](#email--email_host-email_port-email_user-email_pass-admin_email)). |
| SMS works to your own number, not others | Twilio trial account | Verify recipient numbers, or upgrade Twilio. |
| WhatsApp returns `(#190) Invalid OAuth access token` | 24-hour temporary token expired | Generate a permanent token (see [§3 WhatsApp Part C](#whatsapp--whatsapp_access_token-whatsapp_phone_number_id)). |
| `/api/predict/*` returns "ML service" errors | `ML_SERVICE_URL` unreachable or `ML_SERVICE_TOKEN` mismatch | `curl <url>/health` should return `{"status":"ok"}`; for local, ensure `uvicorn app:app --port 8001` is running in `ML Services02/`; in production, confirm both Render services share an identical `ML_SERVICE_TOKEN`. |
| Frontend calls hit the wrong host | `VITE_API_URL` not picked up | Restart `npm run dev` in `Frontend/`. |
| OpenWeather returns "invalid api key" minutes after creation | Newly created keys take ~10 min to activate | Wait and retry. |

---

## 10. Security reminders

- **Never commit `.env` files.** The repo's `.gitignore` excludes them — keep it that way.
- **Never share keys in screenshots, Slack, Discord, or pull requests.** If a key leaks, rotate it on the provider's site (regenerate, then update `.env`) before doing anything else.
- **Never use your real Gmail password as `EMAIL_PASS`.** Always use a generated app password — you can revoke it any time without changing your real password.
- **Use different secrets in production than in development.** Don't reuse local dev `JWT_SECRET` on a deployed server.
- **Rotate secrets regularly** — at least when an employee leaves, after a suspected leak, or at fixed intervals (every 90 days is a common policy).
- **Limit blast radius** in production: lock OpenAI keys to specific projects, scope WhatsApp tokens to only the permissions they need, restrict Atlas network access to your server's IP rather than `0.0.0.0/0`.
- **2-Step Verification (2FA)** should be on for the Google, Meta, and Twilio accounts you use here. Once on, app passwords / system-user tokens are the safe way to access these services programmatically.

---

If you spot a step that doesn't match what you see on a provider's site (provider UIs change every few months), open an issue or PR. The goal of this guide is to be accurate down to the button label.
