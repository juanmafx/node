const BASE_SECURITY_HEADERS = Object.freeze({
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
});

const STRICT_TRANSPORT_SECURITY = 'max-age=31536000; includeSubDomains';

export function sendJson(response, { statusCode, payload, headers = {}, strictTransport, requestId }) {
  if (response.headersSent || response.destroyed) return;
  const body = JSON.stringify(payload ?? {});
  response.writeHead(statusCode, {
    ...BASE_SECURITY_HEADERS,
    ...(strictTransport ? { 'Strict-Transport-Security': STRICT_TRANSPORT_SECURITY } : {}),
    ...headers,
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'X-Request-Id': requestId,
  });
  response.end(body);
}
