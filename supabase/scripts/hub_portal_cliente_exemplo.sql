-- Exemplo: criar cliente + processo (rode DEPOIS da migration 20260615120000)
-- 1) Crie o usuário em Authentication → Users (e-mail + senha)
-- 2) Substitua os UUIDs/e-mails abaixo e execute

/*
insert into public.hub_clientes (nome, slug, email_contato)
values ('Cliente Demo', 'cliente-demo', 'cliente@empresa.com')
returning id;

insert into public.hub_cliente_contas (user_id, cliente_id, nome, email)
values (
  'UUID-DO-AUTH-USER',
  'UUID-DO-HUB_CLIENTES',
  'Nome do Contato',
  'cliente@empresa.com'
);

insert into public.hub_cliente_processos (cliente_id, titulo, descricao, status, etapa_atual, progresso_pct)
values (
  'UUID-DO-HUB_CLIENTES',
  'Implantação do sistema',
  'Configuração inicial e treinamento da equipe.',
  'em_andamento',
  'Homologação',
  45
);
*/
