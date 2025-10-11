/*
  Idempotent Prisma migration runner for Render/CI

  - Runs `prisma migrate deploy` normally on fresh databases
  - If it hits P3005 (database not empty), it marks the baseline and the
    initial schema migration as applied, then runs deploy again.
  - Safe to run repeatedly; `prisma migrate resolve --applied <name>` is idempotent.
*/

const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { join } = require('node:path');

const prisma = (...args) => spawnSync('npx', ['prisma', ...args], { encoding: 'utf8' });

function migrationsPath(name) {
  return join(__dirname, '..', 'prisma', 'migrations', name);
}

function hasMigration(name) {
  return existsSync(migrationsPath(name));
}

function resolveApplied(name) {
  if (!hasMigration(name)) return;
  console.log(`[migrate] Marking migration as applied: ${name}`);
  const r = prisma('migrate', 'resolve', '--applied', name);
  process.stdout.write(r.stdout || '');
  process.stderr.write(r.stderr || '');
}

function deploy() {
  console.log('[migrate] Running prisma migrate deploy');
  const r = prisma('migrate', 'deploy');
  process.stdout.write(r.stdout || '');
  process.stderr.write(r.stderr || '');
  return r;
}

const first = deploy();
if (first.status === 0) {
  process.exit(0);
}

const out = (first.stdout || '') + (first.stderr || '');
if (!out.includes('P3005')) {
  // Some other failure; exit with original status
  process.exit(first.status || 1);
}

console.log('[migrate] Detected P3005 (database not empty). Applying baseline adoption...');

// 1) Try to mark a no-op baseline if present
resolveApplied('00000000000000_baseline');

// 2) If the DB already has the tables from the first migration, mark it as applied too
//    Adjust the name here if your first migration folder name changes.
resolveApplied('20251007110636_initial_schema');

// 3) Try deploy again
const second = deploy();
process.exit(second.status || 0);

