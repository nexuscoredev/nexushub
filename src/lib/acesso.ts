const EMAILS_SOCIOS = ['vinicius@nexustech.com', 'rafael@nexustech.com'] as const;

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
  'felipe@nexustech.com',
] as const;
