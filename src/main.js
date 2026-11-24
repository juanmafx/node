import { createApplication } from './app/create-application.js';
import { loadConfig } from './config/load-config.js';
import { createLogger } from './observability/create-logger.js';
import { loadTlsCredentials } from './security/load-tls-credentials.js';

process.stdout.on('error', () => {});

const logger = createLogger();

try {
  const config = loadConfig();
  const application = createApplication({
    config,
    logger,
    tlsCredentials: loadTlsCredentials(config),
  });
  await application.start();

  let stopping = false;
  const shutdown = async (signal) => {
    if (stopping) return;
    stopping = true;
    logger.info('server_stopping', { signal });
    await application.stop();
    process.exitCode = 0;
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (error) {
  logger.error('startup_failed', { errorName: error.name, message: error.message });
  process.exitCode = 1;
}
