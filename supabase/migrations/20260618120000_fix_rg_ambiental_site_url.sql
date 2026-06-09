-- RG Ambiental: card aponta para o site institucional, não o sistema interno
update public.hub_systems
set url = 'https://rgambiental.com.br/'
where id = 'rh-ambiental';

notify pgrst, 'reload schema';
