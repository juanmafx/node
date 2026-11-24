const ENVIRONMENT_DEFAULTS = Object.freeze({
  staging: Object.freeze({ httpPort: 3000, httpsPort: 3001 }),
  production: Object.freeze({ httpPort: 5000, httpsPort: 4000 }),
});

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_MAX_BODY_BYTES = 64 * 1024;
const MAX_ALLOWED_BODY_BYTES = 10 * 1024 * 1024;

export class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

function parseInteger(name, rawValue, fallback, minimum, maximum) {
  if (rawValue === undefined || rawValue === '') return fallback;
  if (!/^\d+$/.test(rawValue)) throw new ConfigurationError(`${name} must be an integer`);
  const value = Number(rawValue);
  if (value < minimum || value > maximum) {
    throw new ConfigurationError(`${name} must be between ${minimum} and ${maximum}`);
  }
  return value;
}

function resolveEnvironment(rawValue) {
  const environment = (rawValue || 'staging').toLowerCase();
  if (!Object.hasOwn(ENVIRONMENT_DEFAULTS, environment)) {
    throw new ConfigurationError('NODE_ENV must be staging or production');
  }
  return environment;
}

export function loadConfig(env = process.env) {
  const environment = resolveEnvironment(env.NODE_ENV);
  const defaults = ENVIRONMENT_DEFAULTS[environment];
  const tlsKeyPath = env.TLS_KEY_PATH || null;
  const tlsCertPath = env.TLS_CERT_PATH || null;

  if (Boolean(tlsKeyPath) !== Boolean(tlsCertPath)) {
    throw new ConfigurationError('TLS_KEY_PATH and TLS_CERT_PATH must be set together');
  }
  if (environment === 'production' && !tlsKeyPath) {
    throw new ConfigurationError('production requires TLS_KEY_PATH and TLS_CERT_PATH');
  }

  return Object.freeze({
    environment,
    host: env.HOST || DEFAULT_HOST,
    httpPort: parseInteger('HTTP_PORT', env.HTTP_PORT, defaults.httpPort, 0, 65535),
    httpsPort: parseInteger('HTTPS_PORT', env.HTTPS_PORT, defaults.httpsPort, 0, 65535),
    tlsKeyPath,
    tlsCertPath,
    maxBodyBytes: parseInteger('MAX_BODY_BYTES', env.MAX_BODY_BYTES, DEFAULT_MAX_BODY_BYTES, 1, MAX_ALLOWED_BODY_BYTES),
    httpEnabled: environment !== 'production',
    mirrorEnabled: environment !== 'production',
  });
}
