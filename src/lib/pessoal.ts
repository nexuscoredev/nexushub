import type { HubPersonalTransaction } from '../types/database';

export function totalEntradasPessoal(rows: HubPersonalTransaction[]): number {
  return rows
    .filter((r) => r.tipo === 'entrada')
    .reduce((sum, r) => sum + Number(r.valor), 0);
}

export function totalSaidasPessoal(rows: HubPersonalTransaction[]): number {
  return rows
    .filter((r) => r.tipo === 'saida')
    .reduce((sum, r) => sum + Number(r.valor), 0);
}

export function saldoPessoal(rows: HubPersonalTransaction[]): number {
  return totalEntradasPessoal(rows) - totalSaidasPessoal(rows);
}

export const PESSOAL_CATEGORIAS: { value: string; label: string }[] = [
  { value: 'salario', label: 'Salário / pró-labore' },
  { value: 'freelance', label: 'Freelance / extra' },
  { value: 'investimento', label: 'Investimento' },
  { value: 'moradia', label: 'Moradia' },
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'saude', label: 'Saúde' },
  { value: 'lazer', label: 'Lazer' },
  { value: 'educacao', label: 'Educação' },
  { value: 'outras', label: 'Outras' },
];

export function categoriaPessoalLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return PESSOAL_CATEGORIAS.find((c) => c.value === value)?.label ?? value;
}
