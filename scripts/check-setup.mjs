/**
 * Verifica setup local mínimo (sem expor secrets).
 * Uso: node scripts/check-setup.mjs
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const envLocal = join(root, '.env.local');
const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

const env = { ...process.env, ...loadEnv(envLocal) };
let ok = true;

console.log('NEXUS Hub — verificação de setup\n');

for (const key of required) {
  const val = env[key];
  if (val) console.log(`  ✓ ${key}`);
  else {
    console.log(`  ✗ ${key} — defina em .env.local`);
    ok = false;
  }
}

const migrations = [
  'supabase/migrations/20260602100000_initial_schema.sql',
  'supabase/migrations/20260602100001_rls_policies.sql',
  'supabase/migrations/20260602100002_seed_data.sql',
];
for (const m of migrations) {
  console.log(existsSync(join(root, m)) ? `  ✓ ${m}` : `  ✗ ${m} ausente`);
}

console.log(
  ok
    ? '\nPronto para npm run dev (após migrations no Supabase).'
    : '\nVeja SETUP.md para próximos passos.',
);
process.exit(ok ? 0 : 1);
