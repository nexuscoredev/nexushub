export const LIGEIRINHO_PARCEIROS_URL = 'https://ligeirinhobebidas.vercel.app/';
export const LIGEIRINHO_PARCEIROS_LOGO = '/img/systems/ligeirinho-parceiros.png';
export const LIGEIRINHO_PARCEIROS_STATUS_DATE = '10 de junho de 2026';

export const LIGEIRINHO_PARCEIROS_SUMMARY =
  'O Ligeirinho Parceiros saiu de um site simples para um app de pedidos completo, com login, nova marca Parceiros, pagamento online e registro de pedidos — pronto para uso, com melhorias contínuas em andamento.';

export type ParceirosDeliveryStatus = 'done' | 'paused';

export interface LigeirinhoParceirosDelivery {
  title: string;
  status: ParceirosDeliveryStatus;
  note?: string;
}

export const LIGEIRINHO_PARCEIROS_DELIVERIES: LigeirinhoParceirosDelivery[] = [
  { title: 'Site funcionando de forma estável na internet', status: 'done' },
  { title: 'Forma de entrar com Google', status: 'done' },
  { title: 'Forma de entrar com telefone + nome', status: 'done' },
  { title: 'Melhorias na tela de login', status: 'done' },
  {
    title: 'Remoção de “continuar sem conta”',
    status: 'done',
    note: 'Entrada ou cadastro passa a ser mais claro',
  },
  { title: 'Nova identidade Ligeirinho Parceiros', status: 'done' },
  { title: 'Pagamento online (Mercado Pago)', status: 'done' },
  { title: 'Controle de pedidos no sistema', status: 'done' },
  {
    title: 'Entrar com Apple',
    status: 'paused',
    note: 'Para depois — exige taxa anual da Apple',
  },
  {
    title: 'Confirmação do celular por SMS',
    status: 'paused',
    note: 'Não incluído — evita custo por mensagem',
  },
];

export interface LigeirinhoParceirosFeatureGroup {
  id: string;
  title: string;
  subtitle: string;
  items: string[];
}

export const LIGEIRINHO_PARCEIROS_READY_GROUPS: LigeirinhoParceirosFeatureGroup[] = [
  {
    id: 'loja',
    title: 'Loja online',
    subtitle: 'Experiência de compra no celular e no computador',
    items: [
      'Catálogo de bebidas organizado por categorias',
      'Carrinho de compras',
      'Pedido pelo WhatsApp',
      'Site adaptado para celular',
      'Pode ser instalado na tela inicial do celular (como um app)',
    ],
  },
  {
    id: 'login',
    title: 'Entrar na conta',
    subtitle: 'Identificação clara do cliente em cada pedido',
    items: [
      'Entrar com Google — rápido, com conta Google',
      'Entrar com telefone e nome — celular e nome obrigatório nos pedidos',
      'Área Minha conta para ver dados e preferências',
    ],
  },
  {
    id: 'visual',
    title: 'Visual e experiência',
    subtitle: 'Marca Parceiros com identidade amarela',
    items: [
      'Modo claro e escuro (incluindo automático conforme o celular)',
      'Tela de login mais limpa: logo em destaque',
      'Identidade visual Ligeirinho Parceiros — amarelo no lugar do laranja anterior',
    ],
  },
  {
    id: 'payments',
    title: 'Pagamentos e pedidos',
    subtitle: 'Versão mais recente em produção',
    items: [
      'Integração com Mercado Pago para pagamento online',
      'Registro de pedidos no sistema',
      'Página de confirmação após o pedido',
    ],
  },
];

export const LIGEIRINHO_PARCEIROS_CLIENT_FLOW = [
  'Acessa o site pelo celular ou computador',
  'Navega pelo catálogo e adiciona produtos ao carrinho',
  'Pode entrar com Google ou com telefone + nome',
  'Finaliza o pedido (WhatsApp e/ou pagamento online, conforme a versão ativa)',
  'Em Minha conta, vê seus dados e preferências',
];

export const LIGEIRINHO_PARCEIROS_ATTENTION_POINTS = [
  {
    title: 'Telefone sem SMS',
    text: 'O cliente informa nome e número, mas o sistema não envia código de confirmação por mensagem. Isso evita custo mensal de SMS; a identificação depende do que o cliente informar.',
  },
  {
    title: 'Entrar com Apple',
    text: 'Ficou para uma fase futura, pois a Apple cobra anualmente para liberar esse tipo de login.',
  },
  {
    title: 'Atualizações no ar',
    text: 'Depois de mudanças no site, às vezes é preciso atualizar a página no celular (ou fechar e abrir de novo) para ver tudo certinho.',
  },
];

export function parceirosDeliveryStatusLabel(status: ParceirosDeliveryStatus): string {
  if (status === 'done') return 'Concluído';
  return 'Pausado';
}
