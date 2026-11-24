# node

A small, dependency-free HTTP and HTTPS JSON API server built only on the Node.js standard library, with secure defaults.

> **Project history:** originally created in 2021, modernized in 2026.
> Version 1 followed a lesson from a public Node.js course. See [Attribution](#attribution).

## Purpose

This project shows what a web server involves when no framework hides it: parsing the request target, routing, reading a bounded body, shaping responses, terminating TLS, logging, and shutting down cleanly.

## Why this project exists

It began as a learning exercise in the raw `http` and `https` modules. Version 2 keeps that small scope and applies current engineering practice to it: modular structure, input limits, fail-closed configuration, automated tests, and CI. It is a reference and learning project and has not been deployed as a production service.

## What it does

| Route | Methods | Response | Availability |
| --- | --- | --- | --- |
| `/ping` | `GET`, `HEAD` | `200` with `{}` | All environments |
| `/sample` | `GET`, `HEAD` | `406` with `{"name":"sample handler"}`, a fixed demonstration of a custom status | All environments |
| `/mirror` | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` | `200` echoing path, query, method, headers, and body, with credential headers redacted | Staging only |

Other paths return `404`, and unsupported methods return `405` with an `Allow` header. Error bodies have the shape `{"error":"<code>"}`.

## Architecture

```text
src/
├── main.js                  Process entry point and signal handling
├── app/                     Listener creation, limits, and lifecycle
├── config/                  Validated environment configuration
├── http/                    Target parsing, body reading, responses, request pipeline
├── routing/                 Route table and lookup
├── handlers/                Endpoint logic
├── security/                Header redaction and TLS credential loading
└── observability/           Structured JSON logging
```

This is a backend-only service, so it has no `frontend/` directory. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Quick start

Requires Node.js 24 or later. There are no packages to install.

```bash
nvm use
npm start
curl -i http://127.0.0.1:3000/ping
```

## Usage guide

Echo a request in staging:

```bash
curl -s -X POST 'http://127.0.0.1:3000/mirror?tag=a&tag=b' \
  -H 'Content-Type: text/plain' \
  -d 'hello'
```

Run HTTPS locally with a generated 30-day localhost certificate, stored in the gitignored `.certs/` directory:

```bash
npm run cert:dev
TLS_KEY_PATH=.certs/key.pem TLS_CERT_PATH=.certs/cert.pem npm start
curl --cacert .certs/cert.pem https://localhost:3001/ping
```

Run in production mode, which serves HTTPS only and removes `/mirror`:

```bash
NODE_ENV=production TLS_KEY_PATH=/path/to/key.pem TLS_CERT_PATH=/path/to/cert.pem npm start
```

## Configuration

Copy `.env.example` to `.env` and start with `node --env-file=.env src/main.js`, or set the variables directly.

| Variable | Default | Description |
| --- | --- | --- |
| `NODE_ENV` | `staging` | `staging` or `production`; any other value stops startup |
| `HOST` | `127.0.0.1` | Bind address |
| `HTTP_PORT` | `3000` staging, `5000` production | Plaintext port, not opened in production |
| `HTTPS_PORT` | `3001` staging, `4000` production | TLS port |
| `TLS_KEY_PATH` | none | Private key path; required in production |
| `TLS_CERT_PATH` | none | Certificate path; required in production |
| `MAX_BODY_BYTES` | `65536` | Maximum request body, up to 10 MiB |

## Database (optional)

**The service does not use a database.** [`db/schema.sql`](db/schema.sql) is an optional schema for storing `request_completed` log events if you want to analyze them offline. Nothing in the application reads or writes it.

```bash
sqlite3 requests.db < db/schema.sql
```

The automated tests apply the schema on SQLite. It is written for PostgreSQL too, but has not been run there.

## Testing

```bash
npm test
npm run test:report
```

The suite uses the built-in `node:test` runner, with unit tests and integration tests against real sockets. `test:report` regenerates the committed output in [`reports/tests/`](reports/tests/): a readable log with coverage, JUnit XML, and a JSON summary. CI runs `npm test` on every push and pull request.

## Security

- Request bodies, headers, and connection lifetimes are bounded.
- Routing cannot resolve inherited object properties.
- Production requires TLS 1.3 and refuses to start without credentials.
- Logs record request metadata only, never headers, query values, or bodies.
- No private keys are stored in the working tree.

The service has no authentication or rate limiting, because it exposes no private data. Place it behind a reverse proxy if it is ever reachable from the internet. See [SECURITY.md](SECURITY.md) and [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md).

## Attribution

Version 1 closely followed the HTTP and HTTPS server lesson from Pirple's [The Node.js Master Class](https://github.com/pirple/The-NodeJS-Master-Class). The unified request handler, the handler-and-router pattern, and the `sample` route come from that course. Version 2 is a rewrite that keeps those ideas. See [NOTICE.md](NOTICE.md).

## License

No license is granted. The course repository publishes no license, so this project does not claim one. See [NOTICE.md](NOTICE.md).
