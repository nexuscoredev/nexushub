/**
 * Seed usuários NexusClient no Supabase Auth + hub_cliente_contas.
 * Requer SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (nunca VITE_).
 *
 * Uso: npm run seed:cliente-users
 * Login: rgambiental / ligeirinho — senha Nexus123!
 */

import { createClient } from '@supabase/supabase-js';

const PASSWORD = 'Nexus123!';

const CLIENT_USERS = [
  {
    usuario: 'rgambiental',
    email: 'rgambiental@cliente.nexustech.com',
    nome: 'RG Ambiental',
    clienteSlug: 'rh-ambiental',
  },
  {
    usuario: 'ligeirinho',
    email: 'ligeirinho@cliente.nexustech.com',
    nome: 'Ligeirinho',
    clienteSlug: 'ligeirinho',
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

async function findClienteId(slug) {
  const { data, error } = await admin.from('hub_clientes').select('id, nome').eq('slug', slug).maybeSingle();
  if (error) throw new Error(`Cliente ${slug}: ${error.message}`);
  if (!data?.id) throw new Error(`Cliente com slug "${slug}" não encontrado. Rode as migrations.`);
  return data;
}

async function upsertConta({ userId, clienteId, nome, email, usuario }) {
  const { data: existing, error: findError } = await admin
    .from('hub_cliente_contas')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (findError) throw new Error(`Conta ${usuario}: ${findError.message}`);

  const payload = {
    user_id: userId,
    cliente_id: clienteId,
    nome,
    email,
    usuario,
    ativo: true,
  };

  if (existing?.id) {
    const { error } = await admin.from('hub_cliente_contas').update(payload).eq('id', existing.id);
    if (error) throw new Error(`Atualizar conta ${usuario}: ${error.message}`);
    return;
  }

  const { error } = await admin.from('hub_cliente_contas').insert(payload);
  if (error) throw new Error(`Criar conta ${usuario}: ${error.message}`);
}

for (const user of CLIENT_USERS) {
  const cliente = await findClienteId(user.clienteSlug);

  const { data, error } = await admin.auth.admin.createUser({
    email: user.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      nome: user.nome,
      usuario: user.usuario,
      tipo: 'cliente',
    },
  });

  let userId = data.user?.id;

  if (error) {
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
    const found = list?.users?.find((u) => u.email?.toLowerCase() === user.email.toLowerCase());
    if (found) {
      userId = found.id;
      await admin.auth.admin.updateUserById(found.id, {
        password: PASSWORD,
        user_metadata: {
          nome: user.nome,
          usuario: user.usuario,
          tipo: 'cliente',
        },
      });
      console.log(`Auth atualizado: ${user.usuario} (${user.email})`);
    } else {
      console.error(`Erro em ${user.usuario}:`, error.message);
      continue;
    }
  } else {
    console.log(`Auth criado: ${user.usuario} (${data.user?.id})`);
  }

  if (!userId) continue;

  await upsertConta({
    userId,
    clienteId: cliente.id,
    nome: user.nome,
    email: user.email,
    usuario: user.usuario,
  });

  await admin.from('hub_profiles').delete().eq('id', userId);
  console.log(`Conta NexusClient vinculada: ${user.usuario} → ${cliente.nome}`);
}

console.log(`Seed concluído. Login NexusClient: rgambiental / ligeirinho — senha ${PASSWORD}`);
