# ADR-0001: Keep `Frontend/` and `Backend/` as sibling directories instead of an `apps/* + packages/*` monorepo

- **Status:** Accepted
- **Date:** 2026-04-25
- **Deciders:** maintainers

## Context

The repository ships three tiers — a React 19 + Vite SPA in [Frontend/](../../Frontend/), an Express 4 + MongoDB API in [Backend/](../../Backend/), and Python ML scripts in [ML Services/](../../ML%20Services/) invoked from the backend via [`Backend/utils/mlPredictor.js`](../../Backend/utils/mlPredictor.js).

A common alternative is a workspace-managed layout under `apps/web` and `apps/api` with shared code in `packages/shared`, `packages/config`, etc., orchestrated by pnpm workspaces, Turborepo, or Nx. We considered migrating to that shape during a documentation pass.

## Decision

Keep the existing two-app sibling layout. Each tier is an independent npm package with its own `package.json`, lockfile, ESLint config, and scripts. There is no root `package.json`, no workspace manager, and no shared internal package.

## Consequences

**Positive**

- Zero migration risk. The current import paths, build configs, CI workflow, and `child_process.spawn` ML bridge keep working unchanged.
- Honors the [CLAUDE.md](../../CLAUDE.md) non-goal "Reworking entire routing structure" / "Renaming historical directories without migration planning."
- Each tier can be cloned, installed, and run in isolation — useful for contributors who only care about one side.

**Negative**

- No shared types or schemas between client and server. API contracts are documented in [docs/API.md](../API.md) but not enforced at compile time. ADR-0002 explores this trade-off.
- Tooling (ESLint, Prettier, etc.) is duplicated across `Backend/` and `Frontend/`. Keeping them aligned is manual.
- `npm install` must be run twice (once per tier). No "one-shot" `npm install` at the root.

**Revisit when**

- A third sibling app appears that would meaningfully share UI components or schemas with the existing apps.
- Type drift between the API and the client causes a production incident traceable to a missing shared schema.
