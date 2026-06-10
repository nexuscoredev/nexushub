import type { HubPersonalContaGrupo, HubPersonalTransaction } from '../types/database';

export const CARRO_ICON = '/img/personal/pulse-carro.png';

export type PersonalGrupoVisual = {
  icon: string;
  accent: string;
  glow: string;
  label: string;
  photo?: boolean;
};

export function isPhotoIcon(icon: string): boolean {
  return icon === CARRO_ICON;
}

export const GRUPO_VISUAL: Record<HubPersonalContaGrupo, PersonalGrupoVisual> = {
  residencial: {
    icon: '/img/personal/grupo-residencial.svg',
    accent: '#6eb6ff',
    glow: 'rgba(110, 182, 255, 0.22)',
    label: 'Casa & moradia',
  },
  carro: {
    icon: CARRO_ICON,
    photo: true,
    accent: '#a78bfa',
    glow: 'rgba(167, 139, 250, 0.22)',
    label: 'Fiat Pulse',
  },
  gastos_fixos: {
    icon: '/img/personal/grupo-fixos.svg',
    accent: '#34d399',
    glow: 'rgba(52, 211, 153, 0.2)',
    label: 'Rotina fixa',
  },
  variaveis: {
    icon: '/img/personal/grupo-variaveis.svg',
    accent: '#f87171',
    glow: 'rgba(248, 113, 113, 0.22)',
    label: 'Cartões & variáveis',
  },
};

export type ProviderVisual = {
  label: string;
  color: string;
  bg: string;
};

const PROVIDERS: Record<string, ProviderVisual> = {
  nubank: { label: 'Nubank', color: '#fff', bg: '#820ad1' },
  'mercado pago': { label: 'Mercado Pago', color: '#fff', bg: '#009ee3' },
  stellantis: { label: 'Stellantis', color: '#fff', bg: '#1e3a5f' },
  detran: { label: 'Detran', color: '#fff', bg: '#2563eb' },
  vr: { label: 'VR Benefícios', color: '#fff', bg: '#059669' },
};

const CONTA_TITULO_OVERRIDES: Record<string, string> = {
  'sem parar': 'Sem Parar',
  ipva: 'IPVA',
};

const TITULO_PALAVRAS_MINUSCULAS = new Set(['da', 'de', 'do', 'dos', 'das', 'e']);

/** Exibe título da conta com capitalização adequada (ex.: Sem Parar). */
export function formatContaTitulo(descricao: string): string {
  const trimmed = descricao.trim();
  if (!trimmed) return trimmed;

  const key = trimmed.toLowerCase();
  if (CONTA_TITULO_OVERRIDES[key]) return CONTA_TITULO_OVERRIDES[key];

  return trimmed
    .split(/\s+/)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && TITULO_PALAVRAS_MINUSCULAS.has(lower)) return lower;
      if (lower === 'ipva') return 'IPVA';
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

export function providerVisual(notes: string | null | undefined): ProviderVisual | null {
  if (!notes?.trim()) return null;
  const key = notes.trim().toLowerCase();
  return PROVIDERS[key] ?? null;
}

export function itemIcon(descricao: string, categoria: string | null): string {
  const d = descricao.toLowerCase();
  if (d.includes('carro') || d.includes('ipva') || d.includes('gasolina') || d.includes('seguro') || d.includes('sem parar') || categoria === 'transporte') {
    return CARRO_ICON;
  }
  if (d.includes('faculdade') || d.includes('mayara') || categoria === 'educacao') {
    return '/img/finance/mensalidade.svg';
  }
  if (d.includes('mercado') || categoria === 'alimentacao') {
    return '/img/finance/entradas.svg';
  }
  if (d.includes('contabil') || d.includes('barbear') || d.includes('internet móvel')) {
    return '/img/personal/grupo-fixos.svg';
  }
  if (d.includes('nubank') || d.includes('mercado pago') || categoria === 'outras') {
    return '/img/personal/grupo-variaveis.svg';
  }
  if (categoria === 'moradia' || d.includes('condom') || d.includes('apart') || d.includes('luz') || d.includes('internet')) {
    return '/img/personal/grupo-residencial.svg';
  }
  return '/img/finance/pendente.svg';
}

export function totalFixosPessoal(rows: HubPersonalTransaction[]): number {
  return rows
    .filter((r) => r.tipo === 'saida' && r.grupo && r.grupo !== 'variaveis')
    .reduce((s, r) => s + Number(r.valor), 0);
}

export function totalVariaveisPessoal(rows: HubPersonalTransaction[]): number {
  return rows
    .filter((r) => r.grupo === 'variaveis')
    .reduce((s, r) => s + Number(r.valor), 0);
}

export function percentualContasPagas(rows: HubPersonalTransaction[]): number {
  const contas = rows.filter((r) => r.tipo === 'saida' && r.grupo);
  if (contas.length === 0) return 0;
  const pagas = contas.filter((r) => r.pago).length;
  return Math.round((pagas / contas.length) * 100);
}
