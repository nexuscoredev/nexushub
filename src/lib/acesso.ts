import type { HubCargo } from '../types/database';
import { podeGerenciar } from './cargos';

const EMAILS_SOCIOS = ['vinicius@nexustech.com', 'rafael@nexustech.com'] as const;

const EMAIL_FELIPE = 'felipe@nexustech.com';

export function normalizeEmail(email: string | undefined | null): string {
  return (email ?? '').trim().toLowerCase();
}

export function podeAcessarFinanceiroAgenda(email: string | undefined | null): boolean {
  return EMAILS_SOCIOS.includes(
    normalizeEmail(email) as (typeof EMAILS_SOCIOS)[number],
  );
}

export const TEAM_HINT_EMAILS = [
  'vinicius@nexustech.com',
  'rafael@nexustech.com',
  EMAIL_FELIPE,
] as const;

/** Cofre: gestão (CEO, CTO, Administrador) + Felipe */
export function podeAcessarCofre(
  email: string | undefined | null,
  cargo: HubCargo | undefined,
): boolean {
  if (podeGerenciar(cargo)) return true;
  return normalizeEmail(email) === EMAIL_FELIPE;
}
