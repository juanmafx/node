const SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'proxy-authorization',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
  'x-csrf-token',
]);

export const REDACTED_VALUE = '[redacted]';

export function redactHeaders(headers) {
  const redacted = Object.create(null);
  for (const [name, value] of Object.entries(headers)) {
    redacted[name] = SENSITIVE_HEADERS.has(name.toLowerCase()) ? REDACTED_VALUE : value;
  }
  return redacted;
}
