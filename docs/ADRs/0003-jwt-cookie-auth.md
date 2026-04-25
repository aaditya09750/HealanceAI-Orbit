# ADR-0003: Custom JWT-in-cookie auth instead of a managed provider

- **Status:** Accepted
- **Date:** 2026-04-25
- **Deciders:** maintainers

## Context

The platform needs to authenticate end users (consumer health profiles), authenticated admins (blog and ticket management), and verify identity over alternative channels (WhatsApp and SMS OTP for low-friction onboarding in India).

Considered alternatives:

1. **Clerk** or **Auth.js (NextAuth)** — managed/library-driven OAuth + sessions.
2. **better-auth** — modern open-source library with batteries included.
3. **Custom JWT + cookies** with bcrypt password hashing and OTP fallbacks.

## Decision

Use a custom auth stack:

- **Access tokens:** 15-minute JWT signed with `JWT_SECRET`, delivered as `accessToken` httpOnly cookie (and a legacy `token` alias).
- **Refresh tokens:** 30-day JWT signed with `JWT_REFRESH_SECRET`, delivered as `refreshToken` httpOnly cookie. Frontend axios interceptor calls `POST /api/auth/refresh` on 401 and retries the original request.
- **Passwords:** bcryptjs at 12 salt rounds, stored on the `User` document.
- **Verification:** `protect` middleware in [Backend/middleware/authMiddleware.js](../../Backend/middleware/authMiddleware.js) reads `Authorization: Bearer` first, falls back to `accessToken` / `token` cookie, verifies with `JWT_SECRET`, attaches the user document (minus password) to `req.user`. The `admin` middleware additionally checks `req.user.role === 'admin'`.
- **OTP fallbacks:** WhatsApp Cloud API (`/api/whatsapp/*`) and Twilio SMS (`/api/sms/*`) issue 5-minute OTPs that promote to the same JWT cookie pair on verification.
- **Password reset:** `forgot-password` issues a hashed `resetPasswordToken` with 15-minute expiry stored on the User; emailed as a link to `/reset-password/:token`.

## Consequences

**Positive**

- Zero external dependencies for the auth provider — no per-MAU billing, no third-party outage exposure.
- Cookie storage is XSS-resistant (httpOnly) and integrates naturally with the existing axios `withCredentials: true` setup.
- OTP rails (WhatsApp / SMS) plug directly into the same token-issuing path; no second auth surface.

**Negative**

- We own all auth surface area: rate limiting (handled by `express-rate-limit` on `/api/auth`), token rotation, brute-force defense, account-recovery flows.
- No SSO / SAML / org accounts out of the box.
- Refresh-token rotation/revocation is minimal (signature-only check; no per-token blacklist). A leaked refresh token is valid until it expires.
- Two secrets to manage (`JWT_SECRET` and `JWT_REFRESH_SECRET`). Rotation invalidates all sessions.

**Revisit when**

- Enterprise customers require SSO, SCIM provisioning, or audit logs that match SOC2 expectations.
- Refresh-token theft is observed in the wild and per-token revocation becomes mandatory.
- A second client (mobile app) makes cookie-based auth awkward and pushes toward a Bearer-only flow with a token store.
