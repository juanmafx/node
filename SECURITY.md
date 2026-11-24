# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| 2.x | Yes |
| Earlier, unversioned code | No |

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's private vulnerability reporting on this repository's **Security** tab. If it is unavailable, open an issue asking for a private contact channel and include no technical detail.

This is a personal project maintained on a best-effort basis, so no response time is guaranteed.

## Deployment guidance

- Supply TLS credentials from a secret store or a restricted file, never from the repository.
- Run as an unprivileged user behind a reverse proxy that enforces rate limits.
- Keep Node.js on a supported LTS release.

See [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md) for the latest audit.
