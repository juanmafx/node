import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { HttpError } from './http-error.js';
import { parseRequestTarget } from './parse-request-target.js';
import { readBody } from './read-body.js';
import { sendJson } from './send-json.js';

const MAX_LOGGED_PATH_LENGTH = 256;

function resolveRoute(router, path, method) {
  const route = router.resolve(path);
  if (!route) throw new HttpError(404, 'not_found');
  if (!route.methods.includes(method)) {
    throw new HttpError(405, 'method_not_allowed', { Allow: route.methods.join(', ') });
  }
  return route;
}

function describeFailure(error, logger, requestId) {
  if (error instanceof HttpError) return error;
  logger.error('request_failed', { requestId, errorName: error?.name ?? 'UnknownError' });
  return new HttpError(500, 'internal_error');
}

export function createRequestListener({ router, logger, config, secure, idleTimeoutMs }) {
  const transport = secure ? 'https' : 'http';
  const strictTransport = secure && config.environment === 'production';

  return async function handleRequest(request, response) {
    request.socket.setTimeout(idleTimeoutMs);
    const startedAt = performance.now();
    const requestId = randomUUID();
    let loggedPath = null;

    response.once('close', () => {
      logger.info('request_completed', {
        requestId,
        environment: config.environment,
        transport,
        method: request.method,
        path: loggedPath,
        statusCode: response.statusCode,
        durationMs: Number((performance.now() - startedAt).toFixed(3)),
        aborted: !response.writableFinished,
      });
    });

    try {
      const { path, query } = parseRequestTarget(request.url);
      loggedPath = path.slice(0, MAX_LOGGED_PATH_LENGTH);
      const route = resolveRoute(router, path, request.method);
      const payload = route.readsBody ? await readBody(request, config.maxBodyBytes) : '';
      const result = await route.handler({
        path,
        query,
        method: request.method.toLowerCase(),
        headers: request.headers,
        payload,
      });
      sendJson(response, {
        statusCode: result.statusCode,
        payload: result.payload,
        strictTransport,
        requestId,
      });
    } catch (error) {
      const failure = describeFailure(error, logger, requestId);
      const closeConnection = failure.statusCode === 413 ? { Connection: 'close' } : {};
      sendJson(response, {
        statusCode: failure.statusCode,
        payload: { error: failure.code },
        headers: { ...failure.headers, ...closeConnection },
        strictTransport,
        requestId,
      });
    }
  };
}
