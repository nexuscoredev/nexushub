import { useMemo } from 'react';
import type { DemoId } from './sistemaDemoCatalog';
import {
  ADEGA_PRODUTOS,
  COLETA_CLIENTES,
  COLETA_PROGRAMACAO,
  COLETA_MTRS,
  ADEGA_PEDIDOS,
} from './sistemaDemoCatalog';

const OPERATORS = [
  'Marina Costa',
  'Rafael Silva',
  'Camila Duarte',
  'Lucas Mendes',
  'Juliana Rocha',
  'Pedro Almeida',
  'Fernanda Lima',
  'Bruno Carvalho',
];

const COLETA_EMPRESAS = [
  'Metalúrgica Horizonte',
  'Clínica Vida Sul',
  'Lab Química Centro',
  'Supermercado Aurora',
  'Indústria Alimentos Norte',
  'Hospital Regional Leste',
  'Farmácia Central',
  'Gráfica União',
  'Depósito Construção Sul',
  'Clínica Odonto Prime',
  'Fábrica Têxtil Vale',
  'Cooperativa Agrícola Norte',
  'Panificadora Modelo',
  'Centro Diagnóstico Norte',
];

const ROTAS = [
  'Rota A — Industrial',
  'Rota B — Hospitalar',
  'Rota C — Laboratorial',
  'Rota D — Comercial',
  'Rota E — Mista',
];

const CAMINHOES = ['Compactador 01', 'Baú 02', 'Van 03', 'Compactador 04', 'Baú 05', 'Van 06'];

const COLETA_STATUS = ['Em rota', 'Agendada', 'Concluída'] as const;

const MTR_ETAPAS = [
  'Coleta em andamento',
  'Aguardando assinatura',
  'Pesagem concluída',
  'Rascunho — revisão interna',
  'Transporte registrado',
  'Emissão pendente',
  'Coleta agendada',
  'Documento em elaboração',
];

const MTR_STATUS = ['Em andamento', 'Emitido', 'Finalizado', 'Rascunho'] as const;

const REGIOES = [
  'Zona Industrial Sul',
  'Centro e Zona Sul',
  'Região metropolitana',
  'Bairros centrais',
  'Zona Norte',
  'Distrito logístico',
];

const PERIODICIDADES = ['Coleta semanal', '2x por semana', 'Quinzenal', 'Mensal', 'Sob demanda'];

const PERFIS = [
  'Sólido classe II',
  'Infectante grupo A',
  'Químico / reagentes',
  'Reciclável misto',
  'Orgânico controle',
  'Perigoso classe I',
];

const FROTA_STATUS = ['Em rota', 'Em coleta', 'Disponível', 'Manutenção'] as const;

const FROTA_DETALHES = [
  'Rota A — Industrial',
  'Rota B — Hospitalar',
  'Aguardando programação',
  'Retorno previsto 14h',
  'Rota C — Laboratorial',
  'Pátio central',
];

const PEDIDO_CANAIS = ['Totem', 'Delivery', 'PDV', 'App'] as const;
const PEDIDO_STATUS = ['Na fila', 'Separando', 'Pronto', 'Entregue'] as const;

const CLIENTES_BALCAO = ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5', 'Balcão'];
const CLIENTES_NOME = [
  'Ana M.',
  'Carlos R.',
  'Beatriz K.',
  'Diego F.',
  'Helena P.',
  'Marcos T.',
  'Patrícia L.',
  'Renato S.',
];

const TENDENCIAS = ['Alta', 'Estável', 'Baixa'] as const;

const WEEK_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];

export interface KpiItem {
  label: string;
  value: string;
  delta: string;
}

export interface QuickStatItem {
  icon: string;
  label: string;
  value: string;
}

export interface BarItem {
  label: string;
  value: number;
}

export interface ProgressItem {
  label: string;
  pct: number;
}

export interface ColetaProgramacaoRow {
  id: string;
  hora: string;
  cliente: string;
  rota: string;
  caminhao: string;
  status: string;
}

export interface ColetaMtrRow {
  id: string;
  documento: string;
  cliente: string;
  etapa: string;
  status: string;
}

export interface ColetaClienteRow {
  id: string;
  segmento: string;
  icon: string;
  regiao: string;
  periodicidade: string;
  perfil: string;
}

export interface BebidaProduto {
  id: string;
  nome: string;
  preco: number;
  icon: string;
  categoria: string;
}

export interface BebidaPedidoRow {
  id: string;
  pedido: string;
  canal: string;
  cliente: string;
  total: string;
  status: string;
  hora: string;
}

export interface BebidaEstoqueRow {
  id: string;
  sku: string;
  produto: string;
  saldo: string;
  minimo: string;
  status: string;
  pct: number;
}

export interface EventoRow {
  hora: string;
  texto: string;
}

export interface FrotaRow {
  veiculo: string;
  status: string;
  detalhe: string;
}

export interface DestaqueRow {
  produto: string;
  vendas: string;
  tendencia: string;
}

export interface ColetaSessionData {
  demoId: 'coleta';
  operatorName: string;
  hero: { coletasProgramadas: number; mtrAberto: number };
  kpis: KpiItem[];
  quickStats: QuickStatItem[];
  programacao: ColetaProgramacaoRow[];
  mtrs: ColetaMtrRow[];
  clientes: ColetaClienteRow[];
  dashboardBars: BarItem[];
  dashboardLine: BarItem[];
  lineDelta: string;
  dashboardPerfil: ProgressItem[];
  dashboardFrota: FrotaRow[];
  dashboardEventos: EventoRow[];
}

export interface BebidasSessionData {
  demoId: 'ligeirinho';
  operatorName: string;
  hero: { pedidosHoje: number; alertasEstoque: number };
  kpis: KpiItem[];
  quickStats: QuickStatItem[];
  produtos: BebidaProduto[];
  pedidos: BebidaPedidoRow[];
  estoque: BebidaEstoqueRow[];
  dashboardBars: BarItem[];
  dashboardCanais: ProgressItem[];
  dashboardDestaques: DestaqueRow[];
  dashboardEventos: EventoRow[];
}

export type DemoSessionData = ColetaSessionData | BebidasSessionData;

function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function shuffle<T>(rng: () => number, items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function partitionPct(rng: () => number, count: number, total = 100): number[] {
  const raw = Array.from({ length: count }, () => 0.4 + rng() * 0.6);
  const sum = raw.reduce((a, b) => a + b, 0);
  const scaled = raw.map((v) => Math.round((v / sum) * total));
  const diff = total - scaled.reduce((a, b) => a + b, 0);
  scaled[0] += diff;
  return scaled;
}

function formatTonnes(rng: () => number) {
  const v = 2.2 + rng() * 5.8;
  return `${v.toFixed(1).replace('.', ',')} t`;
}

function formatBrl(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatHora(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function randomTimes(rng: () => number, count: number, startMin = 6 * 60 + 15) {
  const times: string[] = [];
  let cursor = startMin;
  for (let i = 0; i < count; i++) {
    times.push(formatHora(cursor));
    cursor += randInt(rng, 35, 95);
  }
  return times;
}

function buildColetaSession(rng: () => number): ColetaSessionData {
  const coletasHoje = randInt(rng, 7, 19);
  const mtrAberto = randInt(rng, 2, 9);
  const rotasAtivas = randInt(rng, 2, 6);
  const volume = formatTonnes(rng);
  const veiculosAtivos = randInt(rng, 2, 5);
  const emAndamento = randInt(rng, 1, Math.min(3, rotasAtivas));

  const kpis: KpiItem[] = [
    { label: 'Coletas hoje', value: String(coletasHoje), delta: `+${randInt(rng, 1, 6)} vs ontem` },
    { label: 'MTR em aberto', value: String(mtrAberto), delta: `${randInt(rng, 1, 4)} aguardando assinatura` },
    { label: 'Volume estimado', value: volume, delta: 'Meta do dia' },
    { label: 'Rotas ativas', value: String(rotasAtivas), delta: `${emAndamento} em andamento` },
  ];

  const quickStats: QuickStatItem[] = [
    { icon: 'route', label: 'Rotas hoje', value: String(rotasAtivas) },
    { icon: 'local_shipping', label: 'Veículos ativos', value: String(veiculosAtivos) },
    { icon: 'scale', label: 'Volume previsto', value: volume },
    { icon: 'description', label: 'MTR pendentes', value: String(mtrAberto) },
  ];

  const horas = randomTimes(rng, COLETA_PROGRAMACAO.length);
  const programacao: ColetaProgramacaoRow[] = COLETA_PROGRAMACAO.map((row, i) => ({
    id: row.id,
    hora: horas[i],
    cliente: pick(rng, COLETA_EMPRESAS),
    rota: pick(rng, ROTAS),
    caminhao: pick(rng, CAMINHOES),
    status: pick(rng, COLETA_STATUS),
  }));

  const mtrs: ColetaMtrRow[] = COLETA_MTRS.map((row, i) => ({
    id: row.id,
    documento: `MTR-${24000 + randInt(rng, 1, 999)}`,
    cliente: programacao[i % programacao.length]?.cliente ?? pick(rng, COLETA_EMPRESAS),
    etapa: pick(rng, MTR_ETAPAS),
    status: pick(rng, MTR_STATUS),
  }));

  const clientes: ColetaClienteRow[] = COLETA_CLIENTES.map((c) => ({
    ...c,
    regiao: pick(rng, REGIOES),
    periodicidade: pick(rng, PERIODICIDADES),
    perfil: pick(rng, PERFIS),
  }));

  const dashboardBars: BarItem[] = WEEK_LABELS.map((label) => ({
    label,
    value: randInt(rng, 18, 92),
  }));

  const dashboardLine: BarItem[] = MONTH_LABELS.map((label) => ({
    label,
    value: randInt(rng, 32, 88),
  }));

  const first = dashboardLine[0].value;
  const last = dashboardLine[dashboardLine.length - 1].value;
  const pct = Math.round(((last - first) / first) * 100);
  const lineDelta = `${pct >= 0 ? '+' : ''}${pct}% nos últimos 6 meses`;

  const perfilLabels = ['Industrial', 'Hospitalar', 'Laboratorial', 'Comercial'];
  const perfilPcts = partitionPct(rng, perfilLabels.length);
  const dashboardPerfil: ProgressItem[] = perfilLabels.map((label, i) => ({
    label,
    pct: perfilPcts[i],
  }));

  const dashboardFrota: FrotaRow[] = shuffle(rng, CAMINHOES)
    .slice(0, 4)
    .map((veiculo) => ({
      veiculo,
      status: pick(rng, FROTA_STATUS),
      detalhe: pick(rng, FROTA_DETALHES),
    }));

  const eventosTextos = [
    () => `MTR emitido · ${pick(rng, COLETA_EMPRESAS)}`,
    () => `Coleta iniciada · ${pick(rng, ROTAS)}`,
    () => `Pesagem registrada · ${(0.8 + rng() * 2.4).toFixed(1).replace('.', ',')} t`,
    () => `${pick(rng, COLETA_EMPRESAS)} adicionado à fila`,
    () => `${pick(rng, ROTAS)} concluída parcialmente · ${randInt(rng, 2, 5)} de ${randInt(rng, 5, 8)} paradas`,
  ];

  const eventoHoras = randomTimes(rng, 5, 6 * 60 + 30);
  const dashboardEventos: EventoRow[] = eventosTextos.map((fn, i) => ({
    hora: eventoHoras[i],
    texto: fn(),
  }));

  return {
    demoId: 'coleta',
    operatorName: pick(rng, OPERATORS),
    hero: { coletasProgramadas: coletasHoje, mtrAberto },
    kpis,
    quickStats,
    programacao,
    mtrs,
    clientes,
    dashboardBars,
    dashboardLine,
    lineDelta,
    dashboardPerfil,
    dashboardFrota,
    dashboardEventos,
  };
}

function buildBebidasSession(rng: () => number): BebidasSessionData {
  const pedidosHoje = randInt(rng, 28, 72);
  const alertasEstoque = randInt(rng, 1, 6);
  const naFila = randInt(rng, 3, 12);
  const ticket = 45 + rng() * 45;

  const kpis: KpiItem[] = [
    { label: 'Pedidos hoje', value: String(pedidosHoje), delta: `+${randInt(rng, 4, 22)}% vs ontem` },
    { label: 'Ticket médio', value: formatBrl(ticket), delta: 'Últimas 24h' },
    { label: 'Estoque baixo', value: String(alertasEstoque), delta: 'Itens abaixo do mínimo' },
    { label: 'Canais ativos', value: '3', delta: 'PDV, totem e delivery' },
  ];

  const quickStats: QuickStatItem[] = [
    { icon: 'receipt_long', label: 'Pedidos hoje', value: String(pedidosHoje) },
    { icon: 'point_of_sale', label: 'PDV aberto', value: pick(rng, ['Sim', 'Sim', 'Sim', 'Não']) },
    { icon: 'inventory_2', label: 'Na fila', value: String(naFila) },
    { icon: 'warning', label: 'Alertas estoque', value: String(alertasEstoque) },
  ];

  const produtos: BebidaProduto[] = shuffle(rng, ADEGA_PRODUTOS).map((p) => ({
    ...p,
    preco: Math.round(p.preco * (0.88 + rng() * 0.24) * 100) / 100,
  }));

  const pedidoHoras = randomTimes(rng, ADEGA_PEDIDOS.length, 9 * 60 + 5);
  const pedidos: BebidaPedidoRow[] = ADEGA_PEDIDOS.map((row, i) => {
    const canal = pick(rng, PEDIDO_CANAIS);
    const cliente =
      canal === 'PDV' || canal === 'Totem'
        ? pick(rng, CLIENTES_BALCAO)
        : pick(rng, CLIENTES_NOME);
    const total = formatBrl(12 + rng() * 140);
    return {
      id: row.id,
      pedido: `#D-${randInt(rng, 1000, 1999)}`,
      canal,
      cliente,
      total,
      status: pick(rng, PEDIDO_STATUS),
      hora: pedidoHoras[i],
    };
  });

  const estoque: BebidaEstoqueRow[] = produtos.map((p, i) => {
    const saldo = randInt(rng, 4, 72);
    const minimo = randInt(rng, 8, 28);
    const pct = Math.min(100, Math.round((saldo / (minimo * 1.8)) * 100));
    const status = saldo < minimo ? 'Baixo' : 'OK';
    return {
      id: String(i + 1),
      sku: `BEV-${String(randInt(rng, 1, 99)).padStart(3, '0')}`,
      produto: p.nome,
      saldo: `${saldo} un.`,
      minimo: `${minimo} un.`,
      status,
      pct,
    };
  });

  const dashboardBars: BarItem[] = WEEK_LABELS.map((label) => ({
    label,
    value: randInt(rng, 22, 98),
  }));

  const canalLabels = ['PDV balcão', 'Totem', 'Delivery'];
  const canalPcts = partitionPct(rng, canalLabels.length);
  const dashboardCanais: ProgressItem[] = canalLabels.map((label, i) => ({
    label,
    pct: canalPcts[i],
  }));

  const destaqueProdutos = shuffle(rng, produtos).slice(0, 4);
  const dashboardDestaques: DestaqueRow[] = destaqueProdutos.map((p) => ({
    produto: p.nome,
    vendas: `${randInt(rng, 5, 24)} un.`,
    tendencia: pick(rng, TENDENCIAS),
  }));

  const eventoHoras = randomTimes(rng, 5, 8 * 60 + 10);
  const dashboardEventos: EventoRow[] = [
    () => `Pedido ${pedidos[0]?.pedido ?? '#D-0000'} · ${pedidos[0]?.canal ?? 'Totem'} · ${pedidos[0]?.cliente ?? 'Mesa 1'}`,
    () => `Estoque baixo · ${estoque.find((e) => e.status === 'Baixo')?.produto ?? produtos[0].nome}`,
    () => `Venda PDV · ${formatBrl(40 + rng() * 120)}`,
    () => `Pedido delivery · ${pick(rng, CLIENTES_NOME)} · Bairro ${pick(rng, ['Centro', 'Norte', 'Sul', 'Leste'])}`,
    () => `Reposição registrada · ${randInt(rng, 12, 48)} un. ${pick(rng, produtos).nome}`,
  ].map((fn, i) => ({
    hora: eventoHoras[i],
    texto: fn(),
  }));

  return {
    demoId: 'ligeirinho',
    operatorName: pick(rng, OPERATORS),
    hero: { pedidosHoje, alertasEstoque },
    kpis,
    quickStats,
    produtos,
    pedidos,
    estoque,
    dashboardBars,
    dashboardCanais,
    dashboardDestaques,
    dashboardEventos,
  };
}

export function createDemoSession(demoId: DemoId): DemoSessionData {
  const seed = Math.floor(Math.random() * 0xffffffff);
  const rng = mulberry32(seed);
  return demoId === 'coleta' ? buildColetaSession(rng) : buildBebidasSession(rng);
}

export function useDemoSessionData(demoId: DemoId, entryKey: string): DemoSessionData {
  return useMemo(() => createDemoSession(demoId), [demoId, entryKey]);
}
