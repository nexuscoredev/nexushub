import { formatBRL } from './format';
import { supabase, supabaseErrorMessage } from './supabase';
import type {
  HubPersonalFinanceMacroCategoria,
  HubPersonalFinanceMacroItem,
} from '../types/database';

export type PersonalFinanceMacroSummary = {
  totalDividasAtuais: number;
  totalDividasRecorrentes: number;
  totalAReceberMensal: number;
  totalParcelasAReceber: number;
  totalRestanteAReceber: number;
  totalAssinaturas: number;
  compromissosMensais: number;
  saldoMacroMensal: number;
};

export type MacroSectionConfig = {
  id: HubPersonalFinanceMacroCategoria;
  label: string;
  subtitle: string;
  icon: string;
  accent: string;
  totalLabel: string;
  showParcelas?: boolean;
};

export const MACRO_SECTIONS: MacroSectionConfig[] = [
  {
    id: 'divida_atual',
    label: 'Dívidas atuais',
    subtitle: 'Quanto ainda falta pagar no total',
    icon: '/img/finance/pendente.svg',
    accent: '#ef4444',
    totalLabel: 'Falta pagar',
  },
  {
    id: 'divida_recorrente',
    label: 'Dívidas recorrentes',
    subtitle: 'Pagamentos fixos mensais de dívida',
    icon: '/img/finance/mensalidade.svg',
    accent: '#f97316',
    totalLabel: 'Por mês',
  },
  {
    id: 'a_receber',
    label: 'A receber',
    subtitle: 'Valores mensais que ainda vão entrar',
    icon: '/img/finance/entradas.svg',
    accent: '#22c55e',
    totalLabel: 'Por mês',
    showParcelas: true,
  },
  {
    id: 'assinatura',
    label: 'Assinaturas',
    subtitle: 'Streaming, apps e serviços fixos',
    icon: '/img/finance/mensalidade.svg',
    accent: '#6366f1',
    totalLabel: 'Por mês',
  },
];

export type MacroItemInput = {
  categoria: HubPersonalFinanceMacroCategoria;
  titulo: string;
  valor_mensal?: number | null;
  saldo_restante?: number | null;
  parcelas_restantes?: number | null;
  notas?: string | null;
  ordem?: number;
};

function isMissingTableError(message: string): boolean {
  return /hub_personal_finance_macro|schema cache|could not find|pgrst205/i.test(message);
}

function sumField(
  items: HubPersonalFinanceMacroItem[],
  categoria: HubPersonalFinanceMacroCategoria,
  field: 'valor_mensal' | 'saldo_restante' | 'parcelas_restantes',
): number {
  return items
    .filter((item) => item.categoria === categoria)
    .reduce((sum, item) => sum + Number(item[field] ?? 0), 0);
}

export function buildPersonalFinanceMacroSummary(
  items: HubPersonalFinanceMacroItem[],
): PersonalFinanceMacroSummary {
  const totalDividasAtuais = sumField(items, 'divida_atual', 'saldo_restante');
  const totalDividasRecorrentes = sumField(items, 'divida_recorrente', 'valor_mensal');
  const totalAReceberMensal = sumField(items, 'a_receber', 'valor_mensal');
  const totalParcelasAReceber = sumField(items, 'a_receber', 'parcelas_restantes');
  const totalAssinaturas = sumField(items, 'assinatura', 'valor_mensal');

  const totalRestanteAReceber = items
    .filter((item) => item.categoria === 'a_receber')
    .reduce(
      (sum, item) =>
        sum + Number(item.valor_mensal ?? 0) * Number(item.parcelas_restantes ?? 0),
      0,
    );

  const compromissosMensais = totalDividasRecorrentes + totalAssinaturas;
  const saldoMacroMensal = totalAReceberMensal - compromissosMensais;

  return {
    totalDividasAtuais,
    totalDividasRecorrentes,
    totalAReceberMensal,
    totalParcelasAReceber,
    totalRestanteAReceber,
    totalAssinaturas,
    compromissosMensais,
    saldoMacroMensal,
  };
}

export function sectionTotal(
  items: HubPersonalFinanceMacroItem[],
  categoria: HubPersonalFinanceMacroCategoria,
): number {
  if (categoria === 'divida_atual') {
    return sumField(items, categoria, 'saldo_restante');
  }
  return sumField(items, categoria, 'valor_mensal');
}

export function sectionParcelasTotal(
  items: HubPersonalFinanceMacroItem[],
  categoria: HubPersonalFinanceMacroCategoria,
): number {
  return sumField(items, categoria, 'parcelas_restantes');
}

export function formatMacroSectionTotal(
  items: HubPersonalFinanceMacroItem[],
  section: MacroSectionConfig,
): string {
  return formatBRL(sectionTotal(items, section.id));
}

export function nextMacroOrdem(
  items: HubPersonalFinanceMacroItem[],
  categoria: HubPersonalFinanceMacroCategoria,
): number {
  const inCategory = items.filter((item) => item.categoria === categoria);
  if (!inCategory.length) return 0;
  return Math.max(...inCategory.map((item) => item.ordem ?? 0)) + 1;
}

export async function fetchPersonalFinanceMacroItems(
  userId: string,
): Promise<HubPersonalFinanceMacroItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('hub_personal_finance_macro')
    .select('*')
    .eq('user_id', userId)
    .order('categoria', { ascending: true })
    .order('ordem', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) {
    const msg = supabaseErrorMessage(error);
    if (isMissingTableError(msg)) return [];
    throw new Error(msg);
  }
  return (data ?? []) as HubPersonalFinanceMacroItem[];
}

export async function upsertPersonalFinanceMacroItem(
  userId: string,
  input: MacroItemInput,
  recordId?: string,
): Promise<{ item: HubPersonalFinanceMacroItem | null; error: string | null }> {
  if (!supabase) return { item: null, error: 'Supabase não configurado.' };

  const payload = {
    user_id: userId,
    categoria: input.categoria,
    titulo: input.titulo.trim(),
    valor_mensal: input.valor_mensal ?? null,
    saldo_restante: input.saldo_restante ?? null,
    parcelas_restantes: input.parcelas_restantes ?? null,
    notas: input.notas?.trim() || null,
    ordem: input.ordem ?? 0,
    updated_at: new Date().toISOString(),
  };

  if (recordId) {
    const { data, error } = await supabase
      .from('hub_personal_finance_macro')
      .update(payload)
      .eq('id', recordId)
      .eq('user_id', userId)
      .select('*')
      .single();
    if (error) {
      const msg = supabaseErrorMessage(error);
      return { item: null, error: isMissingTableError(msg) ? 'Tabela macro ainda não disponível.' : msg };
    }
    return { item: data as HubPersonalFinanceMacroItem, error: null };
  }

  const { data, error } = await supabase
    .from('hub_personal_finance_macro')
    .insert(payload)
    .select('*')
    .single();
  if (error) {
    const msg = supabaseErrorMessage(error);
    return { item: null, error: isMissingTableError(msg) ? 'Tabela macro ainda não disponível.' : msg };
  }
  return { item: data as HubPersonalFinanceMacroItem, error: null };
}

export async function deletePersonalFinanceMacroItem(
  userId: string,
  recordId: string,
): Promise<string | null> {
  if (!supabase) return 'Supabase não configurado.';
  const { error } = await supabase
    .from('hub_personal_finance_macro')
    .delete()
    .eq('id', recordId)
    .eq('user_id', userId);
  if (error) {
    const msg = supabaseErrorMessage(error);
    return isMissingTableError(msg) ? 'Tabela macro ainda não disponível.' : msg;
  }
  return null;
}
