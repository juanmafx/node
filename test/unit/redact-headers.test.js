import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { REDACTED_VALUE, redactHeaders } from '../../src/security/redact-headers.js';

describe('redactHeaders', () => {
  for (const name of ['authorization', 'Cookie', 'proxy-authorization', 'set-cookie', 'x-api-key', 'x-auth-token', 'x-csrf-token']) {
    it(`redacts ${name}`, () => {
      assert.equal(redactHeaders({ [name]: 'placeholder' })[name], REDACTED_VALUE);
    });
  }

  it('keeps non-sensitive headers and does not mutate the input', () => {
    const headers = { accept: 'application/json', cookie: 'placeholder' };
    const redacted = redactHeaders(headers);
    assert.equal(redacted.accept, 'application/json');
    assert.equal(headers.cookie, 'placeholder');
  });
});
