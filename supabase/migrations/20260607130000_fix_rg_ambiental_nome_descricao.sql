-- RG Ambiental: nome e descrição corretos (coleta de resíduos, não RH)
update public.hub_systems
set
  nome = 'RG Ambiental',
  descricao = 'Coleta de resíduos e gestão ambiental.'
where id = 'rh-ambiental';
