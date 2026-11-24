const SENSITIVE_HEADER_PATTERN = /auth|cookie|token|secret|passw|credential|session|api-?key|signature/i;

export const REDACTED_VALUE = '[redacted]';

export function redactHeaders(headers) {
  const redacted = Object.create(null);
  for (const [name, value] of Object.entries(headers)) {
    redacted[name] = SENSITIVE_HEADER_PATTERN.test(name) ? REDACTED_VALUE : value;
  }
  return redacted;
}
