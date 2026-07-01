import type { LigeirinhoDemoApp } from './ligeirinhoDemoData';

export type LigeirinhoModuleLayout =
  | 'fila'
  | 'pedidos'
  | 'kpi-estoque'
  | 'kpi-rh'
  | 'colaboradores'
  | 'tv'
  | 'tabela';

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromKey(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

function ri(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function brl(rng: () => number) {
  return (45 + rng() * 420).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const CLIENTES = [
  'Bar Modelo Centro',
  'Distribuidora Demo Sul',
  'Adega Exemplo',
  'Mercado Fictício',
  'Atacado Piloto',
  'Depósito Amostra',
];

const PRODUTOS = [
  'Cerveja Lata 350ml',
  'Refrigerante 2L',
  'Água Mineral 500ml',
  'Energético 269ml',
  'Vinho Tinto 750ml',
  'Whisky 1L',
];

const COLABORADORES = [
  { nome: 'Ana Modelo', cargo: 'Separador | Retirada', dept: 'Operacional', status: 'Ativo' },
  { nome: 'Bruno Exemplo', cargo: 'Caixa (PDV)', dept: 'Vendas', status: 'Ativo' },
  { nome: 'Carla Demo', cargo: 'Financeiro', dept: 'Administrativo', status: 'Ativo' },
  { nome: 'Diego Teste', cargo: 'Motorista', dept: 'Logística', status: 'Férias' },
  { nome: 'Elisa Amostra', cargo: 'Comercial', dept: 'Vendas', status: 'Ativo' },
  { nome: 'Felipe Modelo', cargo: 'Desenvolvedor', dept: 'TI', status: 'Ativo' },
];

const SUBTITULOS: Record<string, string> = {
  pedidos: 'Pendentes e aguardando pagamento — envio para roteirização.',
  roteirizacao: 'Organize entregas por rota e janela de saída.',
  separacao: 'Fila de retirada e entrega — pedidos prontos para separar.',
  entregas: 'Acompanhe saídas, rotas e confirmações de entrega.',
  ocorrencias: 'Registre e trate ocorrências da operação.',
  organograma: 'Estrutura de setores e responsáveis.',
  cadastros: 'Clientes, fornecedores e parceiros da operação.',
  produtos: 'Catálogo, preços e disponibilidade comercial.',
  etiquetas: 'Modelos de etiqueta para produtos e promoções.',
  promocao: 'Campanhas e condições promocionais.',
  motoristas: 'Cadastro de motoristas e documentação.',
  veiculos: 'Frota, capacidade e disponibilidade.',
  painel: 'Resumo de saldos e movimentos.',
  'tv-alertas': 'Alertas em tempo real para o time de estoque.',
  saldos: 'Saldos por produto e depósito.',
  movimentos: 'Entradas, saídas e ajustes de estoque.',
  lotes: 'Controle de lotes e validade.',
  'entrada-xml': 'Importação de NF-e e conferência.',
  inventario: 'Contagens e divergências de inventário.',
  'inventario-app': 'Inventário pelo aplicativo móvel.',
  colaboradores: 'Usuários do Hub por cargo e departamento.',
  cargos: 'Perfis de acesso e permissões por cargo.',
  admissao: 'Fluxo de admissão e documentação inicial.',
  incentivos: 'Comissões, vales e incentivos da equipe.',
  documentos: 'Documentos e arquivos de RH.',
};

export function layoutForMenuItem(appId: string, itemId: string): LigeirinhoModuleLayout {
  if (itemId === 'separacao') return 'fila';
  if (itemId === 'pedidos') return 'pedidos';
  if (appId === 'estoque' && itemId === 'painel') return 'kpi-estoque';
  if (appId === 'departamento' && itemId === 'painel') return 'kpi-rh';
  if (itemId === 'colaboradores') return 'colaboradores';
  if (itemId === 'tv-alertas') return 'tv';
  return 'tabela';
}

export function subtituloForMenuItem(itemId: string, app: LigeirinhoDemoApp): string {
  return SUBTITULOS[itemId] ?? `Módulo ${app.nome} — dados fictícios para demonstração.`;
}

export interface FilaPedidoRow {
  numero: string;
  cliente: string;
  status: string;
  valor: string;
}

export interface TabelaRow {
  cols: string[];
}

export interface KpiTile {
  valor: string;
  rotulo: string;
  alerta?: boolean;
}

export interface TvAlertaRow {
  titulo: string;
  detalhe: string;
  nivel: 'ok' | 'warn' | 'crit';
}

export interface ModuleContent {
  layout: LigeirinhoModuleLayout;
  fila?: FilaPedidoRow[];
  tabela?: { headers: string[]; rows: TabelaRow[] };
  kpis?: KpiTile[];
  listas?: { titulo: string; itens: string[] }[];
  colaboradores?: typeof COLABORADORES;
  tv?: TvAlertaRow[];
}

export function buildModuleContent(menuKey: string, appId: string, itemId: string): ModuleContent {
  const rng = mulberry32(seedFromKey(menuKey));
  const layout = layoutForMenuItem(appId, itemId);

  if (layout === 'fila') {
    const statuses = ['Aguardando separação', 'Em separação', 'Pronto p/ retirada', 'Aguardando pagamento'];
    return {
      layout,
      fila: Array.from({ length: 8 }, (_, i) => ({
        numero: String(1040 + i),
        cliente: pick(rng, CLIENTES),
        status: pick(rng, statuses),
        valor: brl(rng),
      })),
    };
  }

  if (layout === 'pedidos') {
    return {
      layout,
      tabela: {
        headers: ['Pedido', 'Cliente', 'Canal', 'Total', 'Status'],
        rows: Array.from({ length: 10 }, (_, i) => ({
          cols: [
            `#${2100 + i}`,
            pick(rng, CLIENTES),
            pick(rng, ['Cayena', 'Totem', 'Balcão', 'Parceiros']),
            brl(rng),
            pick(rng, ['Pendente', 'Aguard. pagamento', 'Em negociação']),
          ],
        })),
      },
    };
  }

  if (layout === 'kpi-estoque') {
    return {
      layout,
      kpis: [
        { valor: String(ri(rng, 820, 1240)), rotulo: 'Com saldo' },
        { valor: String(ri(rng, 4, 18)), rotulo: 'Abaixo do mínimo', alerta: true },
        { valor: String(ri(rng, 2, 9)), rotulo: 'Lotes vencendo', alerta: true },
        { valor: String(ri(rng, 12, 48)), rotulo: 'Movimentos hoje' },
        { valor: `${ri(rng, 18, 42)}k`, rotulo: 'Unidades em estoque' },
      ],
      listas: [
        {
          titulo: 'Críticos',
          itens: Array.from({ length: 5 }, () => `${pick(rng, PRODUTOS)} — saldo ${ri(rng, 2, 18)}`),
        },
        {
          titulo: 'Últimos movimentos',
          itens: Array.from({ length: 5 }, () => {
            const tipo = pick(rng, ['Entrada', 'Saída', 'Ajuste']);
            return `${tipo} · ${pick(rng, PRODUTOS)} · ${ri(rng, 6, 120)} un`;
          }),
        },
      ],
    };
  }

  if (layout === 'kpi-rh') {
    return {
      layout,
      kpis: [
        { valor: String(ri(rng, 42, 68)), rotulo: 'Colaboradores ativos' },
        { valor: String(ri(rng, 3, 8)), rotulo: 'Admissões no mês' },
        { valor: String(ri(rng, 1, 4)), rotulo: 'Em férias' },
        { valor: String(ri(rng, 12, 18)), rotulo: 'Cargos cadastrados' },
      ],
      listas: [
        {
          titulo: 'Aniversariantes do mês',
          itens: ['Ana Modelo — 12/06', 'Carla Demo — 21/06', 'Felipe Modelo — 28/06'],
        },
      ],
    };
  }

  if (layout === 'colaboradores') {
    return { layout, colaboradores: COLABORADORES };
  }

  if (layout === 'tv') {
    return {
      layout,
      tv: [
        { titulo: 'Estoque crítico', detalhe: 'Cerveja Lata 350ml abaixo do mínimo', nivel: 'crit' },
        { titulo: 'Lote vencendo', detalhe: 'Refrigerante 2L — validade em 5 dias', nivel: 'warn' },
        { titulo: 'Entrada conferida', detalhe: 'NF 45821 importada com sucesso', nivel: 'ok' },
        { titulo: 'Inventário pendente', detalhe: 'Depósito central — contagem D+2', nivel: 'warn' },
      ],
    };
  }

  const headers =
    itemId === 'motoristas' || itemId === 'veiculos'
      ? ['Nome / Placa', 'Documento', 'Situação', 'Atualizado']
      : itemId === 'saldos' || itemId === 'lotes' || itemId === 'movimentos'
        ? ['Produto', 'Depósito', 'Quantidade', 'Status']
        : ['Código', 'Descrição', 'Responsável', 'Situação'];

  return {
    layout,
    tabela: {
      headers,
      rows: Array.from({ length: 9 }, (_, i) => ({
        cols:
          itemId === 'motoristas'
            ? [
                pick(rng, ['João Modelo', 'Maria Exemplo', 'Carlos Demo']),
                `CNH ${ri(rng, 10000000000, 99999999999)}`,
                pick(rng, ['Ativo', 'Documentação OK']),
                `${ri(rng, 1, 28)}/06/2026`,
              ]
            : itemId === 'veiculos'
              ? [
                  `ABC${ri(rng, 1000, 9999)}`,
                  pick(rng, ['VUC', '3/4', 'Toco']),
                  pick(rng, ['Disponível', 'Em rota', 'Manutenção']),
                  `${ri(rng, 1, 28)}/06/2026`,
                ]
              : [
                  String(1000 + i),
                  pick(rng, PRODUTOS),
                  pick(rng, ['Ana Modelo', 'Bruno Exemplo', 'Equipe Demo']),
                  pick(rng, ['Ativo', 'Pendente', 'Concluído']),
                ],
      })),
    },
  };
}
