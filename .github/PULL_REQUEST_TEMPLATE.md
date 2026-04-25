<!-- Thanks for the PR. Please fill in the sections below. Delete what doesn't apply. -->

## Summary

<!-- One or two sentences on what changed and why. -->

## Type of change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (route, response shape, or env var altered)
- [ ] Documentation only
- [ ] Tooling / CI / build
- [ ] Refactor (no behavior change)

## Screenshots / recordings

<!-- For UI changes, attach a before/after screenshot or short clip. Delete if N/A. -->

## Test plan

<!-- Concrete commands or steps a reviewer can run. Examples:
- `cd Backend && npm run lint`
- `cd Frontend && npm run build`
- Manually: log in, open dashboard, run a heart-disease prediction, confirm result rendered.
-->

## Checklist

- [ ] `cd Backend && npm run lint` passes
- [ ] `cd Frontend && npm run lint` passes
- [ ] `cd Frontend && npm run build` passes
- [ ] No secrets, tokens, or production credentials committed
- [ ] If a new env var was added, the corresponding `.env.example` was updated (per [CLAUDE.md](../CLAUDE.md))
- [ ] If a route or response shape changed, [docs/API.md](../docs/API.md) was updated
- [ ] If architecture, scripts, or workflow changed, [README.md](../README.md) / [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) updated as needed
- [ ] Manually verified the impacted user path

## Related issues

<!-- e.g. Closes #123, Refs #456 -->
