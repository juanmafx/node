# Security Audit

- **Date:** 2026-11-23
- **Scope:** all tracked files on the `modernize/2026` branch, and the names of key material in repository history
- **Method:** manual code review, automated tests, adversarial socket probes, secret scanning, and reproduction of the routing defects against a disposable local copy
- **Limits:** no third-party penetration test and no load testing

Detail is intentionally limited because the affected version 1 code remains on the default branch until this work is merged.

## Findings

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| A-01 | Critical | A TLS private key was tracked in the repository | **Open:** removed from this branch's tree, still present in history |
| A-02 | High | A crafted request path could terminate the process | Fixed |
| A-03 | High | A crafted request path could leave a request hanging | Fixed |
| A-04 | High | Unbounded request bodies allowed memory exhaustion | Fixed |
| A-05 | High | The echo route returned credential headers and was available in every environment | Fixed |
| A-06 | Medium | Headers, query values, and bodies were written to logs | Fixed |
| A-07 | Medium | Path normalization had super-linear worst-case behavior | Fixed |
| A-08 | Medium | No server timeouts or header limits | Fixed |
| A-09 | Medium | Servers bound to all interfaces and allowed plaintext in production | Fixed |
| A-10 | Medium | Unknown environment names silently fell back to staging | Fixed |
| A-11 | Low | Missing security response headers | Fixed |
| A-12 | Low | All HTTP methods accepted on every route | Fixed |
| A-13 | Low | Deprecated `url.parse` API | Fixed |
| A-14 | Low | Key file name casing prevented startup on case-sensitive file systems | Fixed |
| A-15 | High | The echo route returned credential-style headers missing from a fixed list | Fixed |
| A-16 | Medium | Timed-out and rejected connections could stay open, with no idle socket or TLS handshake limit | Fixed |
| A-17 | Medium | A closed log pipe terminated the process | Fixed |
| A-18 | Low | HSTS was sent outside production, including on `localhost` | Fixed |

## Open items

### A-01: private key in history

The key is a self-signed `localhost` key. It is gone from this branch, but remains in earlier commits and on remote branches. **Treat it as compromised and never reuse it.** Removing it from history requires a history rewrite and force-push, which is the owner's decision.

## Accepted risks

- No built-in rate limiting. The recommended deployment places this in a reverse proxy.
- No authentication. The available routes expose no private data.
- No connection-count limit. The recommended deployment places this in a reverse proxy.
- Header redaction on the staging echo route is name-based, so a secret in an unconventionally named header is still echoed.

## Not applicable

The project has no database access, HTML rendering, cookies, sessions, forms, password storage, or dynamic code execution, so SQL injection, stored XSS, CSRF, weak password hashing, and unsafe `eval` do not apply. It has no third-party dependencies to audit.
