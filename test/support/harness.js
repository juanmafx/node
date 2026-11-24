import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApplication } from '../../src/app/create-application.js';
import { loadConfig } from '../../src/config/load-config.js';
import { createLogger } from '../../src/observability/create-logger.js';

export function createEphemeralCertificate() {
  const directory = mkdtempSync(join(tmpdir(), 'node-api-tls-'));
  const keyPath = join(directory, 'key.pem');
  const certPath = join(directory, 'cert.pem');
  execFileSync('openssl', [
    'req', '-x509', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:prime256v1', '-nodes',
    '-keyout', keyPath, '-out', certPath, '-days', '1', '-subj', '/CN=localhost',
    '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1',
  ], { stdio: 'ignore' });
  return {
    keyPath,
    certPath,
    credentials: { key: readFileSync(keyPath), cert: readFileSync(certPath) },
    cleanup: () => rmSync(directory, { recursive: true, force: true }),
  };
}

export async function startApplication({ env = {}, tlsCredentials = null } = {}) {
  const logLines = [];
  const config = loadConfig({ HTTP_PORT: '0', HTTPS_PORT: '0', ...env });
  const logger = createLogger((line) => logLines.push(line));
  const application = createApplication({ config, logger, tlsCredentials });
  const addresses = await application.start();
  return { application, addresses, logLines, config };
}

export function sendRequest({ port, path, method = 'GET', headers = {}, body, secure = false, tls = {} }) {
  const client = secure ? https : http;
  return new Promise((resolve, reject) => {
    const request = client.request(
      { host: '127.0.0.1', port, path, method, headers, agent: false, ...tls },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            text,
            json: text ? JSON.parse(text) : null,
          });
        });
      },
    );
    request.on('error', reject);
    if (body !== undefined) request.write(body);
    request.end();
  });
}
