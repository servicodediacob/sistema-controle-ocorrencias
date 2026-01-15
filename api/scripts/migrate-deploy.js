/*
  Idempotent Prisma migration runner for Render/CI

  - Runs `prisma migrate deploy` normally on fresh databases
  - If it hits P3005 (database not empty), it marks the baseline and the
    initial schema migration as applied, then runs deploy again.
  - Safe to run repeatedly; `prisma migrate resolve --applied <name>` is idempotent.
*/

const { spawnSync } = require('node:child_process');
const { existsSync, readdirSync } = require('node:fs');
const { join } = require('node:path');

const originalDbUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_DATABASE_URL;
const disableDirect = String(process.env.MIGRATE_USE_DIRECT || 'true').toLowerCase() === 'false';

// Prefer a direct connection string if provided (important when DATABASE_URL points to a pooler).
if (directUrl && !disableDirect) {
  console.log('[migrate] Using DIRECT_DATABASE_URL for migrations');
  process.env.DATABASE_URL = directUrl;
} else if (!process.env.DATABASE_URL) {
  console.error('[migrate] DATABASE_URL is not set. Aborting migrations.');
  process.exit(1);
}

const prisma = (...args) => spawnSync('npx', ['prisma', ...args], { encoding: 'utf8' });

function migrationsPath(name) {
  return join(__dirname, '..', 'prisma', 'migrations', name);
}

function hasMigration(name) {
  return existsSync(join(migrationsPath(name), 'migration.sql'));
}

function listMigrationNames() {
  const base = join(__dirname, '..', 'prisma', 'migrations');
  if (!existsSync(base)) return [];
  return readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => existsSync(join(base, name, 'migration.sql')))
    .sort();
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
  console.log(`[migrate] DATABASE_URL in use: ${process.env.DATABASE_URL}`);
  const r = prisma('migrate', 'deploy');
  process.stdout.write(r.stdout || '');
  process.stderr.write(r.stderr || '');
  return r;
}

// 1) Tenta deploy com a URL atual (direta ou pool).
let current = deploy();

// 2) Se falhar com P1001 na URL direta, tenta cair para a URL de pool.
const outFirst = (current.stdout || '') + (current.stderr || '');
if (
  current.status !== 0 &&
  directUrl &&
  !disableDirect &&
  originalDbUrl &&
  originalDbUrl !== directUrl &&
  outFirst.includes('P1001')
)
{
  console.warn('[migrate] P1001 usando DIRECT_DATABASE_URL. Tentando fallback para DATABASE_URL (pool)...');
  process.env.DATABASE_URL = originalDbUrl;
  current = deploy();
}

if (current.status === 0) {
  process.exit(0);
}

const out = (current.stdout || '') + (current.stderr || '');
if (!out.includes('P3005')) {
  // Alguma outra falha; sair com o status atual
  process.exit(current.status || 1);
}

console.log('[migrate] Detected P3005 (database not empty). Applying baseline adoption...');

const migrations = listMigrationNames();
console.log('[migrate] Local migrations detected:', migrations.join(', ') || '(none)');
if (migrations.length === 0) {
  console.log('[migrate] No migrations found locally; cannot baseline.');
  process.exit(first.status || 1);
}

// 1) Try to mark a no-op baseline if present (only if folder contains migration.sql)
if (hasMigration('00000000000000_baseline')) {
  resolveApplied('00000000000000_baseline');
} else {
  console.log('[migrate] Baseline folder not present or missing migration.sql; skipping baseline.');
}

// 2) Mark the earliest real migration as applied (first after baseline)
const firstReal = migrations.find((m) => m !== '00000000000000_baseline');
if (firstReal) {
  resolveApplied(firstReal);
} else {
  console.log('[migrate] No non-baseline migrations to apply as resolved.');
}

// 3) Try deploy again
const second = deploy();
process.exit(second.status || 0);
