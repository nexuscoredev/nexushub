export const LIGEIRINHO_CONTRATO = {
  id: 'ligeirinho-contrato-v8',
  titulo: 'Contrato Executivo V8 — Ligeirinho Hub',
  subtitulo: 'Prestação de serviços e engenharia de software',
  versao: 'V8',
  dataAssinatura: '22 de maio de 2024',
  dataAssinaturaIso: '2024-05-22',
  local: 'São Roque / SP',
  contratada: {
    nome: 'NEXUS Technology Systems',
    cnpj: '66.261.169/0001-03',
    representante: 'Vinícius Santos de Morais',
  },
  contratante: {
    nome: 'Ligeirinho Bebidas',
    cnpj: '60.247.097/0001-63',
    representante: 'Denis do S. Gonçalves',
  },
  investimentoTotal: 'R$ 15.000,00',
  entrada: 'R$ 3.000,00 na assinatura',
  parcelas: '4 parcelas de R$ 3.000,00 (vencimento dia 10)',
  mensalidade: 'R$ 1.000,00/mês após Go-Live (infraestrutura e suporte SaaS)',
  pix: '66.261.169/0001-03',
  pixReferencia: 'Ligeirinho Hub',
  prazoGoLive: '45 dias',
  paginas: [
    { label: 'Página 1 de 2', src: '/docs/ligeirinho/contrato-v8-pagina-1.png', alt: 'Contrato Ligeirinho Hub — página 1' },
    { label: 'Página 2 de 2', src: '/docs/ligeirinho/contrato-v8-pagina-2.png', alt: 'Contrato Ligeirinho Hub — página 2' },
  ],
} as const;

export const LIGEIRINHO_CONTRATO_MODULOS = [
  {
    nome: 'Ligeirinho PDV',
    descricao: 'Interface de caixa rápida com busca, categorias de demanda e gestão de carrinho/checkout em tempo real.',
  },
  {
    nome: 'Ligeirinho Totem',
    descricao: 'Autoatendimento nativo para tablets físicos, com interface limpa e regras para combos comerciais.',
  },
  {
    nome: 'Ligeirinho Operacional',
    descricao: 'App interno para recepção, gestão e expedição — Novos Pedidos, Em Preparação, Em Rota, Entregues e Concluídos Hoje.',
  },
  {
    nome: 'NEXUS Hub Logístico',
    descricao: 'Captura automatizada de pedidos Cayena via Gmail e roteirização com IA para sincronização de entregas.',
  },
] as const;

export const LIGEIRINHO_CONTRATO_FASES = [
  { fase: 'Fase 1 (dias 1–12)', titulo: 'Mapeamento e base PDV', descricao: 'Ajuste dos processos da loja física e lógica do banco central.' },
  { fase: 'Fase 2 (dias 13–24)', titulo: 'Totem de autoatendimento', descricao: 'Front-end do totem e aplicação da identidade visual.' },
  { fase: 'Fase 3 (dias 25–35)', titulo: 'Triagem operacional e logística', descricao: 'App de back-office e indexação dos status de entrega.' },
  { fase: 'Fase 4 (dias 36–45)', titulo: 'Homologação e Go-Live', descricao: 'Autorização de infraestrutura, domínios e ativação em produção.' },
] as const;

export const LIGEIRINHO_CONTRATO_CLIENT_PATH = '/cliente/documentacao/ligeirinho-contrato';
export const LIGEIRINHO_CONTRATO_HUB_PATH = '/sistemas/ligeirinho/documentacao';
