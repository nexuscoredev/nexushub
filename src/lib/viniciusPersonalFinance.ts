import { normalizeEmail } from './acesso';
import type { HubPersonalContaGrupo } from '../types/database';

export const VINICIUS_PERSONAL_EMAIL = 'vinicius@nexustech.com';

export const VINICIUS_VR_MENSAL = 1000;

export function isViniciusPersonalFinance(email: string | undefined | null): boolean {
  return normalizeEmail(email) === VINICIUS_PERSONAL_EMAIL;
}

/** Recursos exclusivos do Vinícius na área pessoal (ninguém mais vê). */
export function isViniciusOnly(email: string | undefined | null): boolean {
  return isViniciusPersonalFinance(email);
}

export const PESSOAL_CONTA_GRUPOS: {
  id: HubPersonalContaGrupo;
  label: string;
  variavel?: boolean;
}[] = [
  { id: 'residencial', label: 'Residencial' },
  { id: 'carro', label: 'Carro' },
  { id: 'gastos_fixos', label: 'Gastos Fixos' },
  { id: 'variaveis', label: 'Contas variáveis R$', variavel: true },
];

export function grupoContaLabel(grupo: HubPersonalContaGrupo | null | undefined): string {
  if (!grupo) return '—';
  return PESSOAL_CONTA_GRUPOS.find((g) => g.id === grupo)?.label ?? grupo;
}
