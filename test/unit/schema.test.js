import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, it } from 'node:test';

const schema = readFileSync(new URL('../../db/schema.sql', import.meta.url), 'utf8');
const INSERT = `INSERT INTO request_log
  (request_id, occurred_at, environment, transport, method, path, status_code, duration_ms, aborted)
  VALUES (?, '2026-11-23T00:00:00.000Z', ?, ?, 'GET', 'ping', ?, ?, FALSE)`;

describe('db/schema.sql', () => {
  let database;

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    database.exec(schema);
  });

  it('applies idempotently', () => {
    database.exec(schema);
    const names = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name);
    assert.ok(names.includes('request_log'));
  });

  it('accepts a valid row', () => {
    database.prepare(INSERT).run('00000000-0000-4000-8000-000000000001', 'staging', 'http', 200, 1.5);
    assert.equal(database.prepare('SELECT COUNT(*) AS total FROM request_log').get().total, 1);
  });

  it('enforces its check constraints', () => {
    const insert = database.prepare(INSERT);
    assert.throws(() => insert.run('id-1', 'unknown', 'http', 200, 1));
    assert.throws(() => insert.run('id-2', 'staging', 'ftp', 200, 1));
    assert.throws(() => insert.run('id-3', 'staging', 'http', 700, 1));
    assert.throws(() => insert.run('id-4', 'staging', 'http', 200, -1));
  });
});
