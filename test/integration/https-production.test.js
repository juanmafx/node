import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { after, before, describe, it } from 'node:test';
import { createApplication } from '../../src/app/create-application.js';
import { loadConfig } from '../../src/config/load-config.js';
import { createLogger } from '../../src/observability/create-logger.js';
import { createEphemeralCertificate, sendRequest, startApplication } from '../support/harness.js';

const MAIN = fileURLToPath(new URL('../../src/main.js', import.meta.url));

describe('production over HTTPS', () => {
  let certificate;
  let context;
  let tls;
  let port;

  before(async () => {
    certificate = createEphemeralCertificate();
    tls = { ca: certificate.credentials.cert, servername: 'localhost' };
    context = await startApplication({
      env: { NODE_ENV: 'production', TLS_KEY_PATH: certificate.keyPath, TLS_CERT_PATH: certificate.certPath },
      tlsCredentials: certificate.credentials,
    });
    port = context.addresses.https;
  });
  after(async () => {
    await context.application.stop();
    certificate.cleanup();
  });

  it('opens no plaintext listener', () => {
    assert.equal(context.addresses.http, undefined);
  });

  it('serves ping with HSTS', async () => {
    const response = await sendRequest({ port, path: '/ping', secure: true, tls });
    assert.equal(response.statusCode, 200);
    assert.match(response.headers['strict-transport-security'], /max-age=31536000/);
  });

  it('does not expose the mirror', async () => {
    const response = await sendRequest({ port, path: '/mirror', secure: true, tls });
    assert.equal(response.statusCode, 404);
  });

  it('refuses TLS 1.2 clients', async () => {
    await assert.rejects(
      sendRequest({ port, path: '/ping', secure: true, tls: { ...tls, maxVersion: 'TLSv1.2' } }),
    );
  });
});

describe('startup failure', () => {
  it('releases the plaintext listener when the HTTPS port is taken', async () => {
    const certificate = createEphemeralCertificate();
    const blocker = net.createServer();
    blocker.listen(0, '127.0.0.1');
    await once(blocker, 'listening');
    const logLines = [];
    const config = loadConfig({
      HTTP_PORT: '0',
      HTTPS_PORT: String(blocker.address().port),
      TLS_KEY_PATH: certificate.keyPath,
      TLS_CERT_PATH: certificate.certPath,
    });
    const application = createApplication({
      config,
      logger: createLogger((line) => logLines.push(line)),
      tlsCredentials: certificate.credentials,
    });
    await assert.rejects(application.start(), { code: 'EADDRINUSE' });
    const httpPort = JSON.parse(logLines[0]).port;
    await assert.rejects(sendRequest({ port: httpPort, path: '/ping' }), { code: 'ECONNREFUSED' });
    blocker.close();
    certificate.cleanup();
  });
});

describe('process entry point', () => {
  it('boots, serves, and exits cleanly on SIGTERM', async () => {
    const child = spawn(process.execPath, [MAIN], {
      env: { PATH: process.env.PATH, HTTP_PORT: '0' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    const listening = new Promise((resolve) => {
      child.stdout.on('data', (chunk) => {
        output += chunk;
        const match = output.match(/"event":"server_listening".*?"port":(\d+)/);
        if (match) resolve(Number(match[1]));
      });
    });
    const port = await listening;
    assert.equal((await sendRequest({ port, path: '/ping' })).statusCode, 200);
    child.kill('SIGTERM');
    const [code] = await once(child, 'exit');
    assert.equal(code, 0);
  });

  it('exits non-zero with a clear error when production lacks TLS', async () => {
    const child = spawn(process.execPath, [MAIN], {
      env: { PATH: process.env.PATH, NODE_ENV: 'production' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    const [code] = await once(child, 'close');
    assert.equal(code, 1);
    assert.match(output, /startup_failed/);
  });
});
