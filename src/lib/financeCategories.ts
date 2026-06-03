import type { HubFinanceInvestment, HubFinanceReceivable } from '../types/database';

export type FinanceFluxo = 'entrada' | 'saida';

export type EntradaSecao = 'implantacoes' | 'mensalidades';

export type SaidaSecao = 'assinaturas' | 'transporte' | 'outras';

export const ENTRADA_SECOES: { id: EntradaSecao; label: string }[] = [
  { id: 'implantacoes', label: 'Implantações' },
  { id: 'mensalidades', label: 'Mensalidades' },
];

export const SAIDA_SECOES: { id: SaidaSecao; label: string }[] = [
  { id: 'assinaturas', label: 'Assinaturas' },
  { id: 'transporte', label: 'Transporte' },
  { id: 'outras', label: 'Outras despesas da empresa' },
];

export function secaoEntradaReceivable(r: HubFinanceReceivable): EntradaSecao {
  const cat = (r.categoria ?? '').toLowerCase();
  if (cat === 'implantacao' || cat === 'implantações') return 'implantacoes';
  if (cat === 'mensalidade' || cat === 'mensalidades') return 'mensalidades';
  if (r.cliente_descricao.toLowerCase().includes('implanta')) return 'implantacoes';
  return 'mensalidades';
}

export function secaoSaidaInvestment(i: HubFinanceInvestment): SaidaSecao {
  const cat = (i.categoria ?? '').toLowerCase();
  if (cat === 'assinatura' || cat === 'assinaturas') return 'assinaturas';
  if (cat === 'transporte') return 'transporte';
  if (cat === 'outras') return 'outras';
  const t = i.titulo.toLowerCase();
  if (t.includes('cursor') || t.includes('supabase')) return 'assinaturas';
  if (t.includes('transport')) return 'transporte';
  if (i.tipo === 'investimento') return 'outras';
  return 'outras';
}

export function categoriaEntradaReceivable(secao: EntradaSecao): string {
  return secao === 'implantacoes' ? 'implantacao' : 'mensalidade';
}

export function categoriaSaidaInvestment(secao: SaidaSecao): string {
  return secao;
}
