import http from 'node:http';
import https from 'node:https';
import { once } from 'node:events';
import { createRequestListener } from '../http/create-request-listener.js';
import { buildRoutes } from '../routing/build-routes.js';
import { createRouter } from '../routing/create-router.js';

const SERVER_LIMITS = Object.freeze({
  headersTimeout: 10_000,
  requestTimeout: 30_000,
  keepAliveTimeout: 5_000,
  timeout: 30_000,
  maxHeadersCount: 100,
  maxRequestsPerSocket: 1_000,
});
const MAX_HEADER_BYTES = 16 * 1024;
const TLS_HANDSHAKE_TIMEOUT_MS = 10_000;
const SHUTDOWN_GRACE_MS = 5_000;
const BAD_REQUEST_RESPONSE = 'HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-Length: 0\r\n\r\n';

function hardenServer(server) {
  Object.assign(server, SERVER_LIMITS);
  server.on('clientError', (_error, socket) => {
    if (!socket.writable) {
      socket.destroy();
      return;
    }
    socket.end(BAD_REQUEST_RESPONSE, () => socket.destroy());
  });
  return server;
}

async function closeServer(server) {
  if (!server.listening) return;
  const closed = once(server, 'close');
  server.close();
  server.closeIdleConnections();
  const forceClose = setTimeout(() => server.closeAllConnections(), SHUTDOWN_GRACE_MS);
  forceClose.unref();
  await closed;
  clearTimeout(forceClose);
}

export function createApplication({ config, logger, tlsCredentials }) {
  const router = createRouter(buildRoutes({ mirrorEnabled: config.mirrorEnabled }));
  const listeners = [];

  if (config.httpEnabled) {
    const listener = createRequestListener({ router, logger, config, secure: false, idleTimeoutMs: SERVER_LIMITS.timeout });
    const server = http.createServer({ maxHeaderSize: MAX_HEADER_BYTES }, listener);
    listeners.push({ transport: 'http', port: config.httpPort, server: hardenServer(server) });
  }
  if (tlsCredentials) {
    const listener = createRequestListener({ router, logger, config, secure: true, idleTimeoutMs: SERVER_LIMITS.timeout });
    const options = {
      ...tlsCredentials,
      minVersion: 'TLSv1.3',
      maxHeaderSize: MAX_HEADER_BYTES,
      handshakeTimeout: TLS_HANDSHAKE_TIMEOUT_MS,
    };
    const server = https.createServer(options, listener);
    server.on('tlsClientError', (_error, socket) => socket.destroy());
    listeners.push({ transport: 'https', port: config.httpsPort, server: hardenServer(server) });
  }

  const stop = async () => {
    await Promise.all(listeners.map(({ server }) => closeServer(server)));
  };

  return {
    async start() {
      const addresses = {};
      try {
        for (const { transport, port, server } of listeners) {
          server.listen(port, config.host);
          await once(server, 'listening');
          addresses[transport] = server.address().port;
          logger.info('server_listening', { transport, host: config.host, port: addresses[transport] });
        }
      } catch (error) {
        await stop();
        throw error;
      }
      return addresses;
    },
    stop,
  };
}
