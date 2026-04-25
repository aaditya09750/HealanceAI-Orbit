# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Root `ARCHITECTURE.md` with system-context, container, ERD, and primary-workflow sequence diagrams.
- `docs/API.md` exhaustively documenting every HTTP endpoint exposed by the backend.
- `docs/SETUP.md` with local-dev walkthrough and per-integration setup (OpenAI, Groq, Twilio, WhatsApp Cloud API, Gmail SMTP, public NIH/FDA/OSM/Open-Meteo APIs).
- `docs/ADRs/` with four architectural decision records: sibling-app layout, no shared-schemas package, JWT cookie auth, ML subprocess bridge.
- `.github/PULL_REQUEST_TEMPLATE.md` and `.github/ISSUE_TEMPLATE/` (bug, feature, config) to standardize contributions.
- `.gitattributes` for line-ending normalization and binary markers.
- `CHANGELOG.md` (this file).

### Changed

_Nothing — this release is documentation-only._

### Removed

_Nothing._

[Unreleased]: https://github.com/aaditya09750/HealanceAI-Orbit/compare/HEAD...HEAD
