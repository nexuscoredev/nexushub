export const LIGEIRINHO_HUB_URL = 'https://ligeirinhohub.vercel.app/';
export const LIGEIRINHO_LOJA_URL = 'https://ligeirinhobebidas.vercel.app/';
export const LIGEIRINHO_STATUS_DATE = '10 de junho de 2026';

export const LIGEIRINHO_SUMMARY =
  'O Ligeirinho Hub centraliza cadastros, vendas, pedidos, marketing e administração da operação — com identidade amarela/dourada, cadastro de produtos aprimorado, formas de pagamento reorganizadas e criação de artes com IA pronta para uso após configurar a chave Gemini.';

export type DeliveryStatus = 'done' | 'pending' | 'study';

export interface LigeirinhoDelivery {
  title: string;
  status: DeliveryStatus;
  note?: string;
}

export const LIGEIRINHO_DELIVERIES: LigeirinhoDelivery[] = [
  {
    title: 'Identidade visual amarelo/dourado da marca',
    status: 'done',
    note: 'Botões, destaques e telas principais alinhados à logo',
  },
  {
    title: 'Correção de tela travada ao sair do PDV ou usar menu lateral',
    status: 'done',
  },
  {
    title: 'Remoção do WhatsApp na criação de pedidos na fila operacional',
    status: 'done',
    note: 'Fluxo alinhado ao balcão e operação interna',
  },
  {
    title: 'Cadastro de produtos com fotos automáticas e upload manual',
    status: 'done',
    note: 'Edição rápida na lista; fotos no PDV, totem e marketing',
  },
  {
    title: 'Formas de pagamento reorganizadas (ordenação, filtros, grade)',
    status: 'done',
  },
  {
    title: 'Marketing — criação de artes com IA (Google Gemini)',
    status: 'done',
    note: 'Stories, Feed e Banner TV; galeria e publicação na TV da loja',
  },
  {
    title: 'Estrutura de banco para artes e galeria',
    status: 'done',
  },
  {
    title: 'Serviço de geração de artes publicado',
    status: 'pending',
    note: 'Falta configurar a chave da API Gemini',
  },
  {
    title: 'Menus, cadastros e catálogo unificado no banco central',
    status: 'done',
  },
  {
    title: 'Integração com dados de clientes e negociação',
    status: 'done',
  },
  {
    title: 'Pedidos via e-mail Cayena (importação Gmail)',
    status: 'study',
    note: 'Análise de viabilidade em andamento',
  },
];

export interface LigeirinhoFeatureGroup {
  id: string;
  title: string;
  subtitle: string;
  items: string[];
}

export const LIGEIRINHO_READY_GROUPS: LigeirinhoFeatureGroup[] = [
  {
    id: 'identity',
    title: 'Identidade visual',
    subtitle: 'Marca Ligeirinho em amarelo/dourado',
    items: [
      'Interface passou do laranja para o amarelo/dourado da marca',
      'Botões, destaques e telas principais seguem a identidade da logo',
    ],
  },
  {
    id: 'fixes',
    title: 'Correções do dia a dia',
    subtitle: 'Estabilidade na operação de balcão',
    items: [
      'Tela travada / não clicava: corrigido ao sair do caixa (PDV) ou usar o menu lateral',
      'Fila operacional: removida opção WhatsApp na criação de pedidos',
    ],
  },
  {
    id: 'products',
    title: 'Cadastro de produtos',
    subtitle: 'Catálogo visual e ágil',
    items: [
      'Busca automática de imagens com fundo branco, com revisão antes de publicar',
      'Upload manual de foto pelo admin',
      'Edição rápida do produto direto na lista',
      'Fotos aparecem no PDV, totem e marketing, quando aprovadas',
    ],
  },
  {
    id: 'payments',
    title: 'Formas de pagamento',
    subtitle: 'Consulta e manutenção mais fácil',
    items: [
      'Tela reorganizada com ordenação por coluna',
      'Filtros e visual em grade para consultar e manter cadastros',
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing com IA',
    subtitle: 'Artes de promoção com Google Gemini',
    items: [
      'Formatos: Stories, Feed e Banner para TV na loja',
      'Artes salvas na galeria do Hub',
      'Publicação na TV da loja com a arte gerada',
      'Limite: 100 criações/mês por usuário autorizado (dev/admin)',
      'Rascunhos removidos após 30 dias; favoritas mantidas',
    ],
  },
  {
    id: 'organization',
    title: 'Organização do sistema',
    subtitle: 'Hub central da operação',
    items: [
      'Menus e cadastros reorganizados (produtos, clientes, configurações)',
      'Catálogo unificado no banco central — sem arquivos antigos',
      'Integração com dados de clientes e negociação melhorada',
    ],
  },
];

export const LIGEIRINHO_NEXT_STEPS = [
  'Configurar a chave Gemini para as artes com IA funcionarem de ponta a ponta',
  'Testar Marketing → Criar arte com um produto real e publicar na TV da loja',
];

export const LIGEIRINHO_ATTENTION_POINTS = [
  {
    title: 'Chave Gemini pendente',
    text: 'O serviço de geração de artes já está publicado, mas é necessário configurar a chave da API para liberar a criação com IA na prática.',
  },
  {
    title: 'Limite de uso da IA',
    text: 'Cada usuário autorizado (desenvolvedores/administradores) pode gerar até 100 artes por mês. Rascunhos antigos são removidos após 30 dias; favoritas permanecem.',
  },
  {
    title: 'Pedidos Cayena',
    text: 'Importação automática de pedidos a partir do Gmail está em estudo — ainda não há prazo definido para implementação.',
  },
];

export function deliveryStatusLabel(status: DeliveryStatus): string {
  if (status === 'done') return 'Concluído';
  if (status === 'pending') return 'Pendente';
  return 'Em estudo';
}
