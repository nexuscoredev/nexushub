/**
 * Seed usuários NEXUS Hub no Supabase Auth.
 * Requer SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (nunca VITE_).
 *
 * Uso: npm run seed:users
 * Login: usuário (vinicius, rafael, felipe) + senha 123456
 */

import { createClient } from '@supabase/supabase-js';

const USERS = [
  {
    usuario: 'vinicius',
    email: 'vinicius@nexustech.com',
    nome: 'Vinícius',
    cargo: 'CTO',
    password: '123456',
  },
  {
    usuario: 'rafael',
    email: 'rafael@nexustech.com',
    nome: 'Rafael',
    cargo: 'CEO',
    password: '123456',
  },
  {
    usuario: 'felipe',
    email: 'felipe@nexustech.com',
    nome: 'Felipe',
    cargo: 'Desenvolvedor',
    password: '123456',
  },
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
    user_metadata: { nome: user.nome, cargo: user.cargo, usuario: user.usuario },
  });

  let userId = data.user?.id;

  if (error) {
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
    const found = list?.users?.find(
      (u) => u.email?.toLowerCase() === user.email.toLowerCase(),
    );
    if (found) {
      userId = found.id;
      await admin.auth.admin.updateUserById(found.id, {
        password: user.password,
        user_metadata: { nome: user.nome, cargo: user.cargo, usuario: user.usuario },
      });
      console.log(`Atualizado: ${user.usuario} (${user.email})`);
    } else {
      console.error(`Erro em ${user.usuario}:`, error.message);
      continue;
    }
  } else {
    console.log(`Criado: ${user.usuario} (${data.user?.id})`);
  }

  if (userId) {
    const { error: profileError } = await admin
      .from('hub_profiles')
      .update({ usuario: user.usuario, nome: user.nome, cargo: user.cargo })
      .eq('id', userId);
    if (profileError) {
      console.warn(`Perfil ${user.usuario}:`, profileError.message);
    }
  }
}

console.log('Seed concluído. Login: vinicius / rafael / felipe — senha 123456');
