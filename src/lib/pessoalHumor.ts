const STORAGE_PREFIX = 'nexus-pessoal-humor';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}:${todayKey()}`;
}

export function loadHumorDoDia(userId: string | undefined): number | null {
  if (!userId || typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(storageKey(userId));
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 10 ? n : null;
}

export function saveHumorDoDia(userId: string, score: number): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(storageKey(userId), String(score));
}

export function humorMensagem(score: number): string {
  if (score <= 2) return 'Dia pesado — tudo bem não estar 100%. Uma pausa curta já ajuda.';
  if (score <= 4) return 'Força. Pequenos passos contam, e amanhã é outra página.';
  if (score <= 6) return 'Na média, e tudo bem. Respira, organiza o que der e segue no seu ritmo.';
  if (score <= 8) return 'Indo bem hoje. Mantém o equilíbrio entre trabalho e descanso.';
  return 'Que energia boa! Aproveita sem culpa — você merece.';
}

export function humorRotulo(score: number): string {
  if (score <= 3) return 'Precisando de cuidado';
  if (score <= 6) return 'Na medida';
  if (score <= 8) return 'Bem';
  return 'Ótimo';
}
