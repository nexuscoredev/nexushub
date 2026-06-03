-- Deep link opcional: abrir chat ao entrar no produto a partir do NEXUS Hub (página Sistemas).
-- Só acrescenta /chat se a URL ainda não terminar em /chat.

update public.hub_systems
set url = rtrim(url, '/') || '/chat'
where id in ('rh-ambiental', 'ligeirinho')
  and url is not null
  and url !~ '/chat$';
