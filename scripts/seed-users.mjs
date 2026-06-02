/**
 * Seed usuários NEXUS Hub no Supabase Auth.
 * Requer SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (nunca VITE_).
 *
 * Uso: npm run seed:users
 * Senha padrão documentada: 123456 (alterar após primeiro login em produção).
 */

import { createClient } from '@supabase/supabase-js';

const USERS = [
  { email: 'vinicius@nexustech.com', nome: 'Vinícius', cargo: 'CTO', password: '123456' },
  { email: 'rafael@nexustech.com', nome: 'Rafael', cargo: 'CEO', password: '123456' },
  { email: 'felipe@nexustech.com', nome: 'Felipe', cargo: 'Desenvolvedor', password: '123456' },
];

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    'Defina SUPABASE_URL (ou VITE_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY no ambiente.',
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

for (const user of USERS) {
  const { data, error } = await admin.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: { nome: user.nome, cargo: user.cargo },
  });

  if (error) {
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
    const found = list?.users?.find(
      (u) => u.email?.toLowerCase() === user.email.toLowerCase(),
    );
    if (found) {
      await admin.auth.admin.updateUserById(found.id, {
        password: user.password,
        user_metadata: { nome: user.nome, cargo: user.cargo },
      });
      console.log(`Atualizado: ${user.email}`);
    } else {
      console.error(`Erro em ${user.email}:`, error.message);
    }
  } else {
    console.log(`Criado: ${user.email} (${data.user?.id})`);
  }
}

console.log('Seed concluído. Senha padrão: 123456 — troque em produção.');
