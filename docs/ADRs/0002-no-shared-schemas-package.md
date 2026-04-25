# ADR-0002: API request/response contracts are documented, not type-shared

- **Status:** Accepted
- **Date:** 2026-04-25
- **Deciders:** maintainers
- **Related:** [ADR-0001](0001-sibling-app-layout.md)

## Context

The frontend and backend communicate over HTTP/JSON. There is no `packages/shared` containing Zod/Valibot schemas, no OpenAPI spec, no tRPC router, and no codegen step. The frontend reaches the backend through hand-written axios services in [Frontend/src/services/api.js](../../Frontend/src/services/api.js); the backend validates inputs ad-hoc inside controllers, mostly leaning on Mongoose schema validators.

Three alternatives were considered:

1. **Introduce `packages/shared` with Zod schemas** for every request/response body, imported by both tiers.
2. **Generate types from an OpenAPI document** committed to the repo.
3. **Adopt tRPC** end-to-end.

## Decision

Keep contracts implicit at the type level and documented exhaustively in [docs/API.md](../API.md). Per-endpoint validation stays inside each controller. No shared schemas package is introduced in this pass.

## Consequences

**Positive**

- No edits required to ~70 controllers and ~12 frontend service files — preserves the existing zero-touch property of this documentation pass.
- No new build step, no codegen, no additional dev-server complexity.
- New contributors can still answer "what does endpoint X return?" from [docs/API.md](../API.md), independent of TypeScript tooling.

**Negative**

- Type drift is possible: a controller can change its response shape without the frontend's TypeScript noticing — because the frontend is JavaScript anyway.
- Validation is inconsistent across controllers (some rely fully on Mongoose, some hand-roll checks). A future schema introduction would need to reconcile these.
- The exhaustive `docs/API.md` becomes a hand-maintained source of truth that can rot if the [PR template](../../.github/PULL_REQUEST_TEMPLATE.md) checklist is skipped.

**Revisit when**

- The codebase migrates to TypeScript on either tier (the cost-benefit shifts sharply).
- A breaking-change incident is caused by an undocumented response-shape change.
- A second client appears (mobile app, admin portal) and would benefit from a single source of truth.
