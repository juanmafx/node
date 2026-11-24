# Changelog

This project follows [Semantic Versioning](https://semver.org/) and the [Keep a Changelog](https://keepachangelog.com/) format.

## [2.0.1] - 2026-11-24

### Documentation

- Corrected the release notes, changelog, and security audit to reflect the published 2.0.0 release and the rewritten repository history.
- No code behaviour change.

## [2.0.0] - 2026-11-24

### Breaking

- Requires Node.js 24 or later and uses ES modules.
- The entry point moved from `index.js` to `src/main.js`.
- The `/mirrow` route is now `/mirror`, and its fields are `path`, `query`, `method`, `headers`, and `payload`.
- `/mirror` is unavailable in production and redacts credential headers.
- Routes accept only their declared methods.
- Production serves HTTPS only and requires `TLS_KEY_PATH` and `TLS_CERT_PATH`.
- The default bind address is `127.0.0.1`.
- Unknown `NODE_ENV` values stop startup.
- Error responses use `{"error":"<code>"}`.

### Added

- Modular `src/` structure, unit and integration tests, committed test reports, and least-privilege CI.
- Optional `db/schema.sql`, architecture and security documentation, and course attribution.
- Structured logs, request ids, security headers, server limits, and graceful shutdown.

### Security

- Fixed the findings marked as fixed in `docs/SECURITY_AUDIT.md`.
- Removed the tracked TLS key and certificate. The key was published with earlier versions and must be treated as compromised.

## [1.0.0] - 2021-01-31

Retroactive label for the original unversioned course-based server. No tag or release was published.
