// Runs the suite and writes sanitized spec, JUnit, and summary reports to reports/tests.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'reports', 'tests');
const specPath = join(output, 'test-results.txt');
const junitPath = join(output, 'test-results.xml');

mkdirSync(output, { recursive: true });

const run = spawnSync(process.execPath, [
  '--test',
  '--experimental-test-coverage',
  '--test-coverage-include=src/**',
  '--test-reporter=spec',
  `--test-reporter-destination=${specPath}`,
  '--test-reporter=junit',
  `--test-reporter-destination=${junitPath}`,
  'test/**/*.test.js',
], { cwd: root, stdio: 'inherit' });

const sanitize = (text) => text.replaceAll(root, '.').replaceAll(`hostname="${hostname()}"`, 'hostname="local"');

for (const path of [specPath, junitPath]) {
  writeFileSync(path, sanitize(readFileSync(path, 'utf8')));
}

const spec = readFileSync(specPath, 'utf8');
const count = (label) => Number(spec.match(new RegExp(`^\\S+ ${label} (\\d+)$`, 'm'))?.[1] ?? -1);

writeFileSync(join(output, 'summary.json'), `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  nodeVersion: process.version,
  platform: process.platform,
  command: 'npm run test:report',
  tests: count('tests'),
  passed: count('pass'),
  failed: count('fail'),
  skipped: count('skipped'),
  exitCode: run.status,
}, null, 2)}\n`);

process.exitCode = run.status ?? 1;
