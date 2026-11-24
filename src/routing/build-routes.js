import { handleMirror } from '../handlers/mirror.js';
import { handlePing } from '../handlers/ping.js';
import { handleSample } from '../handlers/sample.js';

const READ_METHODS = Object.freeze(['GET', 'HEAD']);
const MIRROR_METHODS = Object.freeze(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

export function buildRoutes({ mirrorEnabled }) {
  const routes = [
    { path: 'ping', methods: READ_METHODS, readsBody: false, handler: handlePing },
    { path: 'sample', methods: READ_METHODS, readsBody: false, handler: handleSample },
  ];
  if (mirrorEnabled) {
    routes.push({ path: 'mirror', methods: MIRROR_METHODS, readsBody: true, handler: handleMirror });
  }
  return routes;
}
