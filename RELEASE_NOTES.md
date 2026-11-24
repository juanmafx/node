# Release Notes: 2.0.0

**Status:** prepared, not tagged or published.

Version 2.0.0 rewrites the original 2021 course-based server as a modular, tested, dependency-free service on Node.js 24.

## Highlights

- Clear module boundaries for configuration, HTTP, routing, handlers, security, and logging.
- Bounded input, safe routing, redacted echo output, metadata-only logs, and TLS 1.3 in production.
- Automated tests over real sockets, with reports in `reports/tests/`.

## Upgrading

1. Install Node.js 24 or later.
2. Start with `npm start` instead of `node index.js`.
3. Replace `/mirrow` with `/mirror`, and update clients to the new field names.
4. Provide your own certificate through `TLS_KEY_PATH` and `TLS_CERT_PATH`.
5. Set `HOST` if the service must listen beyond loopback.

## Known issue

A previously committed private key remains in Git history. Do not reuse it. See `docs/SECURITY_AUDIT.md`.

The full list of changes is in [CHANGELOG.md](CHANGELOG.md).
