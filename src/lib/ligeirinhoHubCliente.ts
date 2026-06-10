import type {
  LigeirinhoDelivery,
  LigeirinhoFeatureGroup,
} from './ligeirinhoProject';

export const LIGEIRINHO_HUB_SUMMARY_CLIENTE =
  'O Ligeirinho Hub centraliza vendas no balcão, pedidos da equipe, cadastros, marketing e administração da loja — com identidade amarela/dourada, catálogo visual de produtos e ferramentas de promoção com IA.';

export const LIGEIRINHO_HUB_DELIVERIES_CLIENTE: LigeirinhoDelivery[] = [
  {
    title: 'Identidade visual amarelo/dourado da marca',
    status: 'done',
    note: 'Botões, destaques e telas principais alinhados à logo',
  },
  {
    title: 'Correção de travamentos ao sair do caixa ou usar o menu',
    status: 'done',
  },
  {
    title: 'Fila operacional ajustada ao fluxo de balcão',
    status: 'done',
    note: 'Criação de pedidos alinhada à operação interna',
  },
  {
    title: 'Cadastro de produtos com fotos e edição rápida',
    status: 'done',
    note: 'Fotos aparecem no PDV, totem e materiais de divulgação',
  },
  {
    title: 'Formas de pagamento reorganizadas',
    status: 'done',
    note: 'Consulta e manutenção mais fáceis para a equipe',
  },
  {
    title: 'Marketing — criação de artes com IA',
    status: 'done',
    note: 'Stories, feed, banner para TV e galeria na loja',
  },
  {
    title: 'Galeria de artes e publicação na TV da loja',
    status: 'done',
  },
  {
    title: 'Ativação completa das artes com IA',
    status: 'pending',
    note: 'Última configuração em andamento com a equipe NEXUS',
  },
  {
    title: 'Catálogo único de produtos em todo o sistema',
    status: 'done',
  },
  {
    title: 'Cadastro de clientes e histórico de negociação',
    status: 'done',
  },
  {
    title: 'Integração com pedidos de parceiros logísticos',
    status: 'study',
    note: 'Em análise — prazo a definir',
  },
];

export const LIGEIRINHO_HUB_READY_GROUPS_CLIENTE: LigeirinhoFeatureGroup[] = [
  {
    id: 'identity',
    title: 'Identidade visual',
    subtitle: 'Marca Ligeirinho em amarelo/dourado',
    items: [
      'Interface alinhada à identidade da logo',
      'Botões, destaques e telas principais com visual da marca',
    ],
  },
  {
    id: 'fixes',
    title: 'Estabilidade no dia a dia',
    subtitle: 'Operação de balcão mais fluida',
    items: [
      'Correção de telas que travavam ao sair do caixa ou usar o menu',
      'Fila operacional ajustada ao fluxo real da loja',
    ],
  },
  {
    id: 'products',
    title: 'Cadastro de produtos',
    subtitle: 'Catálogo visual e ágil',
    items: [
      'Busca e revisão de imagens de produtos',
      'Upload de fotos pelo painel administrativo',
      'Edição rápida direto na lista de produtos',
      'Fotos visíveis no PDV, totem e marketing',
    ],
  },
  {
    id: 'payments',
    title: 'Formas de pagamento',
    subtitle: 'Consulta e manutenção mais fácil',
    items: [
      'Tela reorganizada com ordenação e filtros',
      'Visual em grade para consultar cadastros',
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing com IA',
    subtitle: 'Artes de promoção para a loja',
    items: [
      'Formatos: Stories, Feed e Banner para TV na loja',
      'Artes salvas na galeria do Hub',
      'Publicação na TV da loja com a arte gerada',
      'Limite mensal de criações por usuário autorizado',
      'Rascunhos antigos removidos após 30 dias; favoritas mantidas',
    ],
  },
  {
    id: 'organization',
    title: 'Organização do sistema',
    subtitle: 'Tudo centralizado no Hub',
    items: [
      'Menus e cadastros reorganizados (produtos, clientes, configurações)',
      'Catálogo único — uma fonte de verdade para toda a operação',
      'Dados de clientes e negociação integrados',
    ],
  },
];

export const LIGEIRINHO_HUB_NEXT_STEPS_CLIENTE = [
  'Concluir a ativação das artes com IA e testar com um produto real da loja',
  'Publicar uma arte na TV da loja e validar com a equipe',
];

export const LIGEIRINHO_HUB_ATTENTION_CLIENTE = [
  {
    title: 'Artes com IA',
    text: 'A ferramenta já está no ar. Falta apenas a configuração final, feita em conjunto com a equipe NEXUS, para liberar todas as criações.',
  },
  {
    title: 'Limite de criações',
    text: 'Cada usuário autorizado pode gerar até 100 artes por mês. Rascunhos antigos são removidos após 30 dias; favoritas permanecem.',
  },
  {
    title: 'Pedidos de parceiros',
    text: 'A integração automática com pedidos de parceiros logísticos está em análise — ainda sem prazo definido.',
  },
];
