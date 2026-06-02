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
const users = ['vinicius', 'rafael', 'felipe'];

let failed = false;
for (const usuario of users) {
  const { data: email, error: lookupError } = await sb.rpc('hub_email_for_usuario', {
    p_usuario: usuario,
  });
  if (lookupError || !email) {
    console.log(`${usuario}: FAIL — usuário não encontrado (${lookupError?.message ?? 'RPC'})`);
    failed = true;
    continue;
  }

  const { error } = await sb.auth.signInWithPassword({
    email,
    password: '123456',
  });
  if (error) {
    console.log(`${usuario}: FAIL — ${error.message}`);
    failed = true;
  } else {
    console.log(`${usuario}: OK`);
  }
  await sb.auth.signOut();
}
process.exit(failed ? 1 : 0);
