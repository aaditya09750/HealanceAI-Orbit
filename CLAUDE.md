# CLAUDE.md

Guidance for AI coding assistants and developers working in this repository.

## Mission

Improve maintainability and delivery quality without breaking existing functionality, logic, API contracts, or UI behavior.

## Repository Topology

- `Frontend/` - React 19 + Vite SPA (website and dashboard)
- `Backend/` - Express API, MongoDB models, business logic, third-party integrations
- `ML Services/` - Python model training/inference scripts invoked by backend subprocess

## Architectural Boundaries

1. Frontend must not import backend files.
2. Backend must not directly import Python modules.
3. Backend-to-ML communication happens via subprocess calls in `Backend/utils/mlPredictor.js`.
4. Route paths and response fields are externally consumed; avoid breaking shape changes.

## Core Entry Points

- Backend app bootstrap: `Backend/server.js`
- DB connection: `Backend/config/db.js`
- Auth middleware: `Backend/middleware/authMiddleware.js`
- Frontend app shell/router: `Frontend/src/App.jsx`
- Frontend API client: `Frontend/src/services/api.js`
- ML bridge: `Backend/utils/mlPredictor.js`

## Working Rules

- Preserve behavior first. Do not do broad refactors unless explicitly requested.
- Do not remove existing routes, fields, or UI interactions as part of tooling work.
- Keep code edits scoped to task requirements.
- If adding env usage in code, update corresponding `.env.example` file.

## Security Rules

- Never commit secrets, tokens, or production credentials.
- Never commit `.env` files.
- Keep sensitive values in environment variables.

## Development Commands

### Backend

```bash
cd Backend
npm run dev
npm run lint
npm run format:check
```

### Frontend

```bash
cd Frontend
npm run dev
npm run lint
npm run build
npm run format:check
```

## Linting Philosophy

This codebase is standardized for safe adoption in an existing project. Lint is configured to:
- block clear syntax/quality errors
- keep legacy cleanup items as warnings

Do not convert warning-level historical debt into behavior-changing rewrites unless explicitly requested.

## Documentation Expectations

When architecture, scripts, or workflow changes:
- update `README.md`
- update `CONTRIBUTING.md` if contributor workflow changed
- update `docs/ARCHITECTURE.md` for significant runtime or data-flow changes

## High-Risk Areas (Require Extra Care)

- Auth/session cookie handling (`authController`, auth middleware)
- Prediction APIs and model payload contracts
- Chatbot/report analyzer integrations (OpenAI/Groq/FDA/RxNav/OSM)
- Dashboard aggregation calculations and trend payloads

## Testing and Verification

At minimum, for impacted tiers:
- run lint
- run build (frontend)
- manually verify key user path if behavior-affecting changes were made

## Non-Goals for Routine Tasks

- Renaming historical directories (for example `Heart&diabeties`, `Symtums_diseas`) without migration planning
- Reworking entire routing structure
- Replacing persistence model shapes without compatibility strategy
