#!/usr/bin/env node
/**
 * Marca migrations locais como aplicadas no Supabase remoto (baseline).
 * Use quando o schema já existe no projeto mas o histórico CLI divergiu.
 * Uso: npm run db:migrations:repair
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const dir = join(process.cwd(), 'supabase/migrations');
const versions = readdirSync(dir)
  .filter((f) => f.endsWith('.sql'))
  .map((f) => f.split('_')[0])
  .filter((v) => /^\d{14}$/.test(v))
  .sort();

if (versions.length === 0) {
  console.error('Nenhuma migration encontrada.');
  process.exit(1);
}

console.log(`Reparando ${versions.length} migrations no projeto linkado…`);

const args = ['supabase', 'migration', 'repair', '--linked', '--status', 'applied', '--yes', ...versions];
const result = spawnSync('npx', args, { stdio: 'inherit', shell: true });

process.exit(result.status ?? 1);
