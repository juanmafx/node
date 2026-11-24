import { redactHeaders } from '../security/redact-headers.js';

export function handleMirror({ path, query, method, headers, payload }) {
  return {
    statusCode: 200,
    payload: { path, query, method, headers: redactHeaders(headers), payload },
  };
}
