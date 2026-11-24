import assert from 'node:assert/strict';
import net from 'node:net';
import { after, before, describe, it } from 'node:test';
import { sendRequest, startApplication } from '../support/harness.js';

describe('HTTP API', () => {
  let context;
  let port;
  const call = (options) => sendRequest({ port, ...options });

  before(async () => {
    context = await startApplication({ env: { MAX_BODY_BYTES: '1024' } });
    port = context.addresses.http;
  });
  after(() => context.application.stop());

  it('answers ping with an empty JSON object', async () => {
    const response = await call({ path: '/ping' });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json, {});
    assert.match(response.headers['content-type'], /^application\/json/);
  });

  it('answers HEAD without a body', async () => {
    const response = await call({ path: '/ping', method: 'HEAD' });
    assert.equal(response.statusCode, 200);
    assert.equal(response.text, '');
  });

  it('keeps the sample handler status and payload', async () => {
    const response = await call({ path: '/sample' });
    assert.equal(response.statusCode, 406);
    assert.deepEqual(response.json, { name: 'sample handler' });
  });

  it('normalizes surrounding slashes when routing', async () => {
    assert.equal((await call({ path: '//ping//' })).statusCode, 200);
  });

  it('returns 404 for unknown routes', async () => {
    const response = await call({ path: '/missing' });
    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.json, { error: 'not_found' });
  });

  for (const path of ['/__proto__', '/constructor', '/toString', '/hasOwnProperty']) {
    it(`does not resolve the inherited property ${path}`, async () => {
      assert.equal((await call({ path })).statusCode, 404);
      assert.equal((await call({ path: '/ping' })).statusCode, 200);
    });
  }

  it('returns 405 with Allow for an unsupported method', async () => {
    const response = await call({ path: '/ping', method: 'POST', body: 'x' });
    assert.equal(response.statusCode, 405);
    assert.equal(response.headers.allow, 'GET, HEAD');
  });

  it('refuses TRACE on the mirror', async () => {
    assert.equal((await call({ path: '/mirror', method: 'TRACE' })).statusCode, 405);
  });

  it('mirrors the request and redacts credentials', async () => {
    const response = await call({
      path: '/mirror/?a=1&a=2',
      method: 'POST',
      headers: { authorization: 'Bearer placeholder', cookie: 'session=placeholder', 'x-trace': 'visible' },
      body: '{"hello":"world"}',
    });
    assert.equal(response.statusCode, 200);
    assert.equal(response.json.path, 'mirror');
    assert.equal(response.json.method, 'post');
    assert.deepEqual(response.json.query.a, ['1', '2']);
    assert.equal(response.json.payload, '{"hello":"world"}');
    assert.equal(response.json.headers['x-trace'], 'visible');
    assert.equal(response.json.headers.authorization, '[redacted]');
    assert.equal(response.json.headers.cookie, '[redacted]');
    assert.ok(!response.text.includes('placeholder'));
  });

  it('serves reflected markup as inert JSON', async () => {
    const response = await call({ path: '/mirror', method: 'POST', body: '<script>alert(1)</script>' });
    assert.match(response.headers['content-type'], /^application\/json/);
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
    assert.match(response.headers['content-security-policy'], /default-src 'none'/);
  });

  it('rejects an oversized declared body', async () => {
    const response = await call({ path: '/mirror', method: 'POST', body: 'x'.repeat(1025) });
    assert.equal(response.statusCode, 413);
    assert.equal(response.headers.connection, 'close');
  });

  it('rejects an oversized chunked body', async () => {
    const response = await call({
      path: '/mirror',
      method: 'POST',
      headers: { 'transfer-encoding': 'chunked' },
      body: 'x'.repeat(4096),
    });
    assert.equal(response.statusCode, 413);
  });

  it('rejects invalid UTF-8', async () => {
    const response = await call({ path: '/mirror', method: 'POST', body: Buffer.from([0xc3, 0x28]) });
    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.json, { error: 'invalid_utf8_body' });
  });

  it('sets the baseline security headers without HSTS on plaintext', async () => {
    const { headers } = await call({ path: '/ping' });
    assert.equal(headers['cache-control'], 'no-store');
    assert.equal(headers['x-frame-options'], 'DENY');
    assert.equal(headers['referrer-policy'], 'no-referrer');
    assert.equal(headers['cross-origin-resource-policy'], 'same-origin');
    assert.equal(headers['strict-transport-security'], undefined);
    assert.match(headers['x-request-id'], /^[0-9a-f-]{36}$/);
  });

  it('ignores a client-supplied request id', async () => {
    const { headers } = await call({ path: '/ping', headers: { 'x-request-id': 'forged' } });
    assert.notEqual(headers['x-request-id'], 'forged');
  });

  it('answers malformed HTTP with 400 and stays available', async () => {
    const reply = await new Promise((resolve, reject) => {
      const socket = net.connect(port, '127.0.0.1', () => socket.write('NOT HTTP\r\n\r\n'));
      let received = '';
      socket.on('data', (chunk) => { received += chunk; });
      socket.on('end', () => resolve(received));
      socket.on('error', reject);
    });
    assert.match(reply, /^HTTP\/1\.1 400/);
    assert.equal((await call({ path: '/ping' })).statusCode, 200);
  });

  it('closes the connection after rejecting malformed HTTP', async () => {
    const closed = await new Promise((resolve) => {
      const socket = net.connect({ port, host: '127.0.0.1', allowHalfOpen: true }, () => socket.write('NOT HTTP\r\n\r\n'));
      let probe;
      const finish = (result) => {
        clearInterval(probe);
        clearTimeout(deadline);
        socket.destroy();
        resolve(result);
      };
      const deadline = setTimeout(() => finish(false), 2_000);
      socket.resume();
      socket.on('end', () => {
        probe = setInterval(() => socket.write('x'), 25);
      });
      socket.on('error', () => finish(true));
      socket.on('close', () => finish(true));
    });
    assert.equal(closed, true);
  });

  it('logs metadata but never headers, query values, or payloads', async () => {
    await call({
      path: '/mirror?token=query-marker',
      method: 'POST',
      headers: { authorization: 'Bearer header-marker' },
      body: 'payload-marker',
    });
    await new Promise((resolve) => setImmediate(resolve));
    const log = context.logLines.join('');
    assert.ok(log.includes('"event":"request_completed"'));
    for (const marker of ['query-marker', 'header-marker', 'payload-marker']) {
      assert.ok(!log.includes(marker));
    }
  });

  it('escapes control characters in logged paths', async () => {
    await call({ path: '/forged%0A%7B%22level%22%3A%22error%22%7D' });
    await new Promise((resolve) => setImmediate(resolve));
    for (const line of context.logLines.join('').trim().split('\n')) {
      assert.doesNotThrow(() => JSON.parse(line));
    }
  });
});
