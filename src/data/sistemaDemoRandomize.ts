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
  'Tiago Nascimento',
  'Camila Duarte',
  'Lucas Mendes',
  'Juliana Rocha',
  'Pedro Almeida',
  'Fernanda Lima',
  'Bruno Carvalho',
];

const COLETA_EMPRESAS = [
  'Indústria Modelo Sul',
  'Clínica Exemplo Norte',
  'Laboratório Demo Centro',
  'Comércio Fictício Leste',
  'Fábrica Amostra Oeste',
  'Hospital Referência Demo',
  'Farmácia Piloto Central',
  'Gráfica Teste União',
  'Depósito Modelo Vale',
  'Cooperativa Demo Agrícola',
  'Panificadora Exemplo',
  'Centro Diagnóstico Modelo',
];

const MOTORISTAS_NOMES = [
  'ALEX MODELO',
  'BRUNO EXEMPLO',
  'CARLA DEMO',
  'DANIEL TESTE',
  'ELISA AMOSTRA',
  'FABIO PILOTO',
  'GISELE MODELO',
  'HENRIQUE DEMO',
  'IRIS EXEMPLO',
  'JORGE TESTE',
  'KARINA AMOSTRA',
  'LEO MODELO',
];

const VEICULO_MODELOS = ['ROLLON', 'POLI-TRIPLO', 'VÁCUO', 'BAÚ', 'COMPACTADOR', 'VUC'];

const REPRESENTANTES_NOMES = ['LETÍCIA DEMO', 'RAFAEL MODELO', 'CAMILA EXEMPLO', 'MARCOS TESTE', 'HELENA AMOSTRA'];

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

export interface ColetaMotoristaRow {
  id: string;
  nome: string;
  cpf: string;
  cnh: string;
  categoria: string;
  validadeCnh: string;
  mopp: string;
  valMopp: string;
}

export interface ColetaVeiculoRow {
  id: string;
  placa: string;
  motorista: string;
  modelo: string;
  tara: string;
  bruto: string;
  cmt: string;
  disponibilidade: string;
}

export interface ColetaRepresentanteRow {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
}

export interface ColetaFrotaLiveRow {
  id: string;
  placa: string;
  tipo: string;
  motorista: string;
  status: string;
  velocidade: string;
}

export interface ColetaDashboardMetrics {
  totalFaturado: string;
  totalPedidos: number;
  totalCancelado: string;
  totalCustos: string;
  residuosKg: number;
  volumeM3: number;
  totalColetas: number;
  coletasConcluidas: number;
  coletasPendentes: number;
  coletasCanceladas: number;
  totalClientes: number;
  kmRodados: string;
  agendadas: number;
  emRota: number;
  atrasadas: number;
  finalizadasHoje: number;
  programacoesMes: number;
  coletasFixas: number;
  comMtr: number;
  aguardandoMtr: number;
}

export type ColetaDashboardPeriod =
  | 'today'
  | 'yday'
  | '7d'
  | '15d'
  | '30d'
  | 'month'
  | 'lastmonth'
  | 'year'
  | 'custom';

export interface ColetaDashboardView {
  metrics: ColetaDashboardMetrics;
  dashboardBars: BarItem[];
  dashboardLine: BarItem[];
  dashboardPerfil: ProgressItem[];
  lineDelta: string;
  periodTitle: string;
}

const PERIOD_SCALES: Record<ColetaDashboardPeriod, number> = {
  today: 0.04,
  yday: 0.05,
  '7d': 0.17,
  '15d': 0.3,
  '30d': 0.48,
  month: 0.8,
  lastmonth: 0.72,
  year: 1,
  custom: 0.55,
};

const PERIOD_TITLES: Record<ColetaDashboardPeriod, string> = {
  today: 'Hoje',
  yday: 'Ontem',
  '7d': 'Últimos 7 dias',
  '15d': 'Últimos 15 dias',
  '30d': 'Últimos 30 dias',
  month: 'Este mês',
  lastmonth: 'Mês passado',
  year: 'Este ano',
  custom: 'Período personalizado',
};

const PERIOD_BAR_LABELS: Record<ColetaDashboardPeriod, string[]> = {
  today: ['06h', '08h', '10h', '12h', '14h', '16h', '18h'],
  yday: ['06h', '08h', '10h', '12h', '14h', '16h', '18h'],
  '7d': WEEK_LABELS,
  '15d': ['S1', 'S2', 'S3', 'S4', 'S5'],
  '30d': ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
  month: ['S1', 'S2', 'S3', 'S4', 'S5'],
  lastmonth: ['S1', 'S2', 'S3', 'S4', 'S5'],
  year: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  custom: ['Per. A', 'Per. B', 'Per. C', 'Per. D', 'Per. E', 'Per. F'],
};

const PERIOD_LINE_LABELS: Record<ColetaDashboardPeriod, string[]> = {
  today: ['08h', '10h', '12h', '14h', '16h', '18h'],
  yday: ['08h', '10h', '12h', '14h', '16h', '18h'],
  '7d': ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'],
  '15d': ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
  '30d': MONTH_LABELS,
  month: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
  lastmonth: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
  year: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
  custom: ['Início', 'Meio', 'Fim', 'Atual'],
};

const RANK_LABELS = [
  'Cliente modelo A',
  'Cliente modelo B',
  'Cliente modelo C',
  'Cliente modelo D',
];

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function scaledInt(rng: () => number, min: number, max: number, scale: number) {
  return Math.max(0, Math.round(randInt(rng, min, max) * scale));
}

export function buildColetaDashboardForPeriod(
  entryKey: string,
  period: ColetaDashboardPeriod,
): ColetaDashboardView {
  const rng = mulberry32(hashString(`${entryKey}::dashboard::${period}`));
  const scale = PERIOD_SCALES[period];

  const totalColetas = Math.max(1, scaledInt(rng, 320, 520, scale));
  const coletasConcluidas = Math.min(
    totalColetas,
    Math.max(0, randInt(rng, Math.max(1, Math.floor(totalColetas * 0.65)), Math.max(1, Math.floor(totalColetas * 0.92)))),
  );
  const coletasPendentes = scaledInt(rng, 80, 160, scale);
  const coletasCanceladas = scaledInt(rng, 20, 90, scale);
  const programacoesMes = scaledInt(rng, 160, 240, scale);
  const comMtr = scaledInt(rng, 18, 48, scale);
  const aguardandoMtr = scaledInt(rng, 120, 200, scale);

  const metrics: ColetaDashboardMetrics = {
    totalFaturado: formatBrl(scaledInt(rng, 180000, 420000, scale)),
    totalPedidos: Math.max(1, scaledInt(rng, 280, 480, scale)),
    totalCancelado: formatBrl(scaledInt(rng, 8000, 35000, scale)),
    totalCustos: formatBrl(scaledInt(rng, 45000, 120000, scale)),
    residuosKg: scaledInt(rng, 1200, 8900, scale),
    volumeM3: scaledInt(rng, 40, 280, scale),
    totalColetas,
    coletasConcluidas,
    coletasPendentes,
    coletasCanceladas,
    totalClientes: scaledInt(rng, 85, 220, Math.min(scale + 0.15, 1)),
    kmRodados: scaledInt(rng, 180000, 3200000, scale).toLocaleString('pt-BR'),
    agendadas: scaledInt(rng, 12, 38, scale),
    emRota: scaledInt(rng, 4, 14, scale),
    atrasadas: scaledInt(rng, 0, 6, scale),
    finalizadasHoje: scaledInt(rng, 2, 18, period === 'today' || period === 'yday' ? 1 : scale),
    programacoesMes,
    coletasFixas: Math.max(0, programacoesMes - comMtr),
    comMtr,
    aguardandoMtr,
  };

  const barLabels = PERIOD_BAR_LABELS[period];
  const lineLabels = PERIOD_LINE_LABELS[period];

  const dashboardBars: BarItem[] = barLabels.map((label) => ({
    label,
    value: randInt(rng, 8, 92),
  }));

  const dashboardLine: BarItem[] = lineLabels.map((label) => ({
    label,
    value: randInt(rng, 20, 95),
  }));

  const first = dashboardLine[0].value;
  const last = dashboardLine[dashboardLine.length - 1].value;
  const pct = Math.round(((last - first) / Math.max(first, 1)) * 100);
  const lineDelta = `${pct >= 0 ? '+' : ''}${pct}% · ${PERIOD_TITLES[period].toLowerCase()}`;

  const rankPcts = partitionPct(rng, RANK_LABELS.length);
  const dashboardPerfil: ProgressItem[] = RANK_LABELS.map((label, i) => ({
    label,
    pct: rankPcts[i],
  }));

  return {
    metrics,
    dashboardBars,
    dashboardLine,
    dashboardPerfil,
    lineDelta,
    periodTitle: PERIOD_TITLES[period],
  };
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
  metrics: ColetaDashboardMetrics;
  motoristas: ColetaMotoristaRow[];
  veiculos: ColetaVeiculoRow[];
  representantes: ColetaRepresentanteRow[];
  frotaLive: ColetaFrotaLiveRow[];
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

  const totalColetas = randInt(rng, 320, 520);
  const coletasConcluidas = randInt(rng, Math.floor(totalColetas * 0.7), Math.floor(totalColetas * 0.92));
  const coletasPendentes = randInt(rng, 80, 160);
  const coletasCanceladas = randInt(rng, 20, 90);
  const programacoesMes = randInt(rng, 160, 240);
  const comMtr = randInt(rng, 18, 48);
  const aguardandoMtr = randInt(rng, 120, 200);

  const metrics: ColetaDashboardMetrics = {
    totalFaturado: formatBrl(randInt(rng, 180000, 420000)),
    totalPedidos: randInt(rng, 280, 480),
    totalCancelado: formatBrl(randInt(rng, 8000, 35000)),
    totalCustos: formatBrl(randInt(rng, 45000, 120000)),
    residuosKg: randInt(rng, 1200, 8900),
    volumeM3: randInt(rng, 40, 280),
    totalColetas,
    coletasConcluidas,
    coletasPendentes,
    coletasCanceladas,
    totalClientes: randInt(rng, 85, 220),
    kmRodados: randInt(rng, 180000, 3200000).toLocaleString('pt-BR'),
    agendadas: randInt(rng, 12, 38),
    emRota: randInt(rng, 4, 14),
    atrasadas: randInt(rng, 0, 6),
    finalizadasHoje: randInt(rng, 2, 18),
    programacoesMes,
    coletasFixas: programacoesMes - comMtr,
    comMtr,
    aguardandoMtr,
  };

  const motoristas: ColetaMotoristaRow[] = shuffle(rng, MOTORISTAS_NOMES)
    .slice(0, 12)
    .map((nome, i) => ({
      id: String(i + 1),
      nome,
      cpf: rng() > 0.35 ? '-' : `${randInt(rng, 100, 999)}.${randInt(rng, 100, 999)}.${randInt(rng, 100, 999)}-${randInt(rng, 10, 99)}`,
      cnh: '-',
      categoria: '-',
      validadeCnh: '-',
      mopp: pick(rng, ['Não', 'Não', 'Sim']),
      valMopp: '-',
    }));

  const veiculos: ColetaVeiculoRow[] = Array.from({ length: 14 }, (_, i) => {
    const hasSpecs = rng() > 0.4;
    return {
      id: String(i + 1),
      placa: `DEM${randInt(rng, 1, 9)}${String.fromCharCode(65 + randInt(rng, 0, 25))}${randInt(rng, 10, 99)}`,
      motorista: rng() > 0.7 ? pick(rng, MOTORISTAS_NOMES) : '-',
      modelo: pick(rng, VEICULO_MODELOS),
      tara: hasSpecs ? `${(8 + rng() * 6).toFixed(2)}T` : '-',
      bruto: hasSpecs ? `${(18 + rng() * 18).toFixed(2)}T` : '-',
      cmt: hasSpecs ? `${(28 + rng() * 12).toFixed(2)}T` : '-',
      disponibilidade: pick(rng, ['Disponível', 'Disponível', 'Em rota', 'Manutenção']),
    };
  });

  const representantes: ColetaRepresentanteRow[] = REPRESENTANTES_NOMES.map((nome, i) => ({
    id: String(i + 1),
    nome,
    email: `${nome.split(' ')[0].toLowerCase()}@exemplo.demo`,
    telefone: `(11) 9${randInt(rng, 1000, 9999)}-${randInt(rng, 1000, 9999)}`,
    cpf: '-',
  }));

  const frotaLive: ColetaFrotaLiveRow[] = veiculos.slice(0, 4).map((v) => ({
    id: v.id,
    placa: v.placa,
    tipo: `${v.modelo} — Coleta`,
    motorista: pick(rng, MOTORISTAS_NOMES),
    status: pick(rng, ['EM ROTA', 'PARADO', 'MANUTENÇÃO', 'EM ROTA']),
    velocidade: v.disponibilidade === 'Em rota' ? `${randInt(rng, 32, 68)} km/h` : '0 km/h',
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
    metrics,
    motoristas,
    veiculos,
    representantes,
    frotaLive,
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
