import { readFileSync } from 'node:fs';

export function loadTlsCredentials({ tlsKeyPath, tlsCertPath }) {
  if (!tlsKeyPath || !tlsCertPath) return null;
  return { key: readFileSync(tlsKeyPath), cert: readFileSync(tlsCertPath) };
}
