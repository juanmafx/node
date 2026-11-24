import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HttpError } from '../../src/http/http-error.js';
import { parseRequestTarget, trimSlashes } from '../../src/http/parse-request-target.js';

describe('parseRequestTarget', () => {
  it('trims leading and trailing slashes', () => {
    assert.equal(parseRequestTarget('///ping///').path, 'ping');
    assert.equal(parseRequestTarget('/').path, '');
  });

  it('keeps a protocol-relative target on the local origin', () => {
    assert.equal(parseRequestTarget('//example.test/ping').path, 'example.test/ping');
  });

  it('collects repeated query keys into arrays', () => {
    const { query } = parseRequestTarget('/mirror?a=1&a=2&a=3&b=x');
    assert.deepEqual(query.a, ['1', '2', '3']);
    assert.equal(query.b, 'x');
  });

  it('stores prototype-named query keys as inert data', () => {
    const { query } = parseRequestTarget('/mirror?__proto__=polluted&constructor=x');
    assert.equal(Object.getPrototypeOf(query), null);
    assert.equal(query.__proto__, 'polluted');
    assert.equal({}.polluted, undefined);
  });

  for (const target of ['*', 'http://example.test/ping', '', undefined]) {
    it(`rejects the target ${String(target)}`, () => {
      assert.throws(() => parseRequestTarget(target), (error) => error instanceof HttpError && error.statusCode === 400);
    });
  }

  it('trims a long run of slashes in linear time', () => {
    const hostile = `${'/'.repeat(200_000)}a${'/'.repeat(200_000)}b`;
    const startedAt = performance.now();
    assert.equal(trimSlashes(hostile).endsWith('b'), true);
    assert.ok(performance.now() - startedAt < 200);
  });
});
