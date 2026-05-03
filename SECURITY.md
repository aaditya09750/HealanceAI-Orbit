# Security Policy

Healance AI is a health and wellness platform that handles user profile data,
medical report uploads, and third-party API integrations (OpenAI, Groq,
Twilio, WhatsApp Cloud, email). We take security reports seriously.

---

## Supported versions

Only the latest `main` branch receives security fixes. If you deployed an
older build, upgrade before reporting.

| Version | Supported |
| ------- | --------- |
| `main`  | ✅        |
| older   | ❌        |

---

## Reporting a vulnerability

**Please do not open a public GitHub issue for security problems.**

Instead, report privately to the maintainers by:

1. **Email:** `aadigunjal0975@gmail.com` with subject `SECURITY: <short summary>`.
2. If email is unavailable, use
   [GitHub Private Vulnerability Reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability)
   on this repository.

Include the following in your report, if possible:

- A clear description of the issue and the impact.
- Steps to reproduce — a minimal proof-of-concept is ideal.
- The affected area (Backend route, Frontend page, ML script, dependency).
- Your assessment of severity (CVSS score is helpful but not required).
- Any suggested remediation.

We aim to:

- **Acknowledge** your report within **72 hours**.
- **Triage and respond** with a status update within **7 days**.
- **Coordinate disclosure** once a fix is available; we will credit reporters
  who wish to be named.

---

## Scope

In-scope for this policy:

- The Backend API (`Backend/`) — auth flows, route handlers, file upload,
  report analysis, prediction endpoints.
- The Frontend SPA (`Frontend/`) — auth context, protected routes, axios
  interceptors, client-side storage.
- The ML subprocess bridge (`Backend/utils/mlPredictor.js`) and the Python
  predictor scripts it invokes.
- Deployment configurations committed to this repo.

Out of scope:

- Third-party services we consume (OpenAI, Groq, Twilio, WhatsApp Cloud,
  OpenStreetMap Overpass, openFDA, NIH RxNav) — report to the vendor.
- Social engineering, physical attacks, and DDoS against any hosted
  environment not owned by this project.
- Vulnerabilities that require a rooted/jailbroken device or an already
  compromised dependency supply chain.

---

## Known hardening checklist

Operators deploying this project should:

- Rotate `JWT_SECRET` and all third-party API keys on first deploy.
- Serve only over HTTPS and enable HSTS upstream of Express.
- Use a managed MongoDB cluster with auth enabled and IP allow-listing.
- Keep `NODE_ENV=production` in production, which enables secure cookies and
  hides error stack traces.
- Restrict `CLIENT_URL` to the exact frontend origin (no wildcards).
- Monitor the `/api/auth/*` rate limiter and lower `AUTH_RATE_LIMIT_MAX` if
  you see brute-force traffic.
- Review uploaded files on a schedule and clear stale `Backend/uploads/`.

---

## Safe Harbor

We will not pursue legal action against researchers who:

- Act in good faith and do not intentionally harm users or degrade the service.
- Limit testing to accounts you control; do not access other users' data.
- Give us reasonable time to remediate before public disclosure.
- Do not exfiltrate, store, or share personally identifiable information
  beyond what is strictly necessary to demonstrate the issue.

Thank you for helping keep Healance AI users safe.
