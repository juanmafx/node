# Release Notes: 2.0.1

Version 2.0.1 is a documentation-only release. It contains no code behaviour change from 2.0.0.

## Changes

- The changelog and release notes no longer describe 2.0.0 as unreleased.
- The security audit marks finding A-01, a TLS private key in Git history, as resolved. On 2026-11-24 the public history was rewritten to keep only the 2026 modernization commits, so no branch or tag contains the key.

## Security note

The key was published before the rewrite. Treat it as compromised and do not reuse it. See [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md).

## Upgrading

No action is needed when upgrading from 2.0.0. For the changes introduced in 2.0.0, see [CHANGELOG.md](CHANGELOG.md).
