import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConfigurationError, loadConfig } from '../../src/config/load-config.js';

const TLS = { TLS_KEY_PATH: '/run/secrets/key', TLS_CERT_PATH: '/run/secrets/cert' };

describe('loadConfig', () => {
  it('defaults to staging on loopback with the mirror enabled', () => {
    const config = loadConfig({});
    assert.equal(config.environment, 'staging');
    assert.equal(config.host, '127.0.0.1');
    assert.equal(config.httpPort, 3000);
    assert.equal(config.httpsPort, 3001);
    assert.equal(config.mirrorEnabled, true);
    assert.equal(config.httpEnabled, true);
  });

  it('uses production ports and disables plaintext and the mirror', () => {
    const config = loadConfig({ NODE_ENV: 'PRODUCTION', ...TLS });
    assert.equal(config.httpPort, 5000);
    assert.equal(config.httpsPort, 4000);
    assert.equal(config.httpEnabled, false);
    assert.equal(config.mirrorEnabled, false);
  });

  it('refuses production without TLS', () => {
    assert.throws(() => loadConfig({ NODE_ENV: 'production' }), ConfigurationError);
  });

  it('refuses a partial TLS configuration', () => {
    assert.throws(() => loadConfig({ TLS_KEY_PATH: '/run/secrets/key' }), ConfigurationError);
  });

  for (const name of ['prod', 'constructor', '__proto__']) {
    it(`refuses the unknown environment ${name}`, () => {
      assert.throws(() => loadConfig({ NODE_ENV: name }), ConfigurationError);
    });
  }

  for (const value of ['abc', '-1', '70000', '1.5']) {
    it(`refuses the invalid port ${value}`, () => {
      assert.throws(() => loadConfig({ HTTP_PORT: value }), ConfigurationError);
    });
  }

  it('refuses a zero or oversized body limit', () => {
    assert.throws(() => loadConfig({ MAX_BODY_BYTES: '0' }), ConfigurationError);
    assert.throws(() => loadConfig({ MAX_BODY_BYTES: '10485761' }), ConfigurationError);
  });

  it('applies valid overrides', () => {
    const config = loadConfig({ HOST: '0.0.0.0', HTTP_PORT: '8080', MAX_BODY_BYTES: '1024' });
    assert.equal(config.host, '0.0.0.0');
    assert.equal(config.httpPort, 8080);
    assert.equal(config.maxBodyBytes, 1024);
  });
});
