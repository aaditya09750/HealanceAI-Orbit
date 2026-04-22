# Contributing to Healance AI Orbit

Thanks for contributing. This guide defines the workflow and quality bar for safe, maintainable changes.

## Scope and Principles

- Keep changes focused and atomic.
- Preserve current behavior unless change explicitly requires behavior updates.
- Do not commit secrets, local env files, uploads, generated artifacts, or virtual environments.
- Update documentation when introducing script, config, or env changes.

## Prerequisites

- Node.js 20 LTS (minimum 18)
- npm 9+
- MongoDB
- Python 3.11+ (only if touching `ML Services/`)

## Local Development

```bash
# Backend
cd Backend
cp .env.example .env
npm install
npm run dev

# Frontend (new terminal)
cd Frontend
cp .env.example .env
npm install
npm run dev
```

## Branching

Use short-lived branches from `main`:
- `feat/<name>`
- `fix/<name>`
- `docs/<name>`
- `chore/<name>`

## Commit Convention

Use Conventional Commits:

```text
<type>(<scope>): <summary>
```

Examples:
- `feat(dashboard): add weekly trend legend`
- `fix(auth): clear refresh cookie on logout`
- `docs(readme): update env setup section`

## Required Checks Before PR

Run checks for each touched tier.

### Backend

```bash
cd Backend
npm run lint
npm run format:check
```

### Frontend

```bash
cd Frontend
npm run lint
npm run build
npm run format:check
```

## Pull Request Checklist

- [ ] One logical change per PR
- [ ] No secrets or `.env` files committed
- [ ] Lint/build checks pass for touched tiers
- [ ] Docs updated (README/CONTRIBUTING/CLAUDE/env templates) if needed
- [ ] UI changes include screenshots
- [ ] API changes include request/response notes

## Coding Guidelines

### JavaScript/React/Node
- Use ES modules.
- Prefer `const`, then `let`; avoid `var`.
- Keep controllers thin and push reusable logic into `utils/`.
- Preserve existing API response shape unless versioning/migration is planned.

### Python (ML Services)
- Keep scripts stdin/stdout JSON-compatible where backend invokes them.
- Avoid breaking model artifact paths used by backend bridge.

## Documentation Policy

When behavior or setup changes, update at least one of:
- `README.md` (setup/runtime)
- `docs/ARCHITECTURE.md` (flow/structure)
- `CLAUDE.md` (assistant and dev guardrails)

## Security Reporting

Do not create public issues for vulnerabilities. Follow `SECURITY.md`.
