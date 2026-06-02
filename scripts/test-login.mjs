import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';

const envPath = '.env.local';
if (!existsSync(envPath)) {
  console.error('Missing .env.local');
  process.exit(1);
}

const env = {};
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#') || !t.includes('=')) continue;
  const i = t.indexOf('=');
  let v = t.slice(i + 1);
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  env[t.slice(0, i)] = v;
}

const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const users = [
  'vinicius@nexustech.com',
  'rafael@nexustech.com',
  'felipe@nexustech.com',
];

let failed = false;
for (const email of users) {
  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password: '123456',
  });
  if (error) {
    console.log(`${email}: FAIL — ${error.message}`);
    failed = true;
  } else {
    console.log(`${email}: OK`);
  }
  await sb.auth.signOut();
}
process.exit(failed ? 1 : 0);
