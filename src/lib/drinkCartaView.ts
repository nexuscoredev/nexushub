export type DrinkCartaViewMode =
  | 'icons-xl'
  | 'icons-lg'
  | 'icons-md'
  | 'icons-sm'
  | 'list'
  | 'details'
  | 'tiles'
  | 'content';

export type DrinkCartaViewOption = {
  id: DrinkCartaViewMode;
  label: string;
  shortLabel: string;
};

export const DRINK_CARTA_VIEW_OPTIONS: DrinkCartaViewOption[] = [
  { id: 'icons-xl', label: 'Ícones extra grandes', shortLabel: 'Extra grande' },
  { id: 'icons-lg', label: 'Ícones grandes', shortLabel: 'Grande' },
  { id: 'icons-md', label: 'Ícones médios', shortLabel: 'Médio' },
  { id: 'icons-sm', label: 'Ícones pequenos', shortLabel: 'Pequeno' },
  { id: 'list', label: 'Lista', shortLabel: 'Lista' },
  { id: 'details', label: 'Detalhes', shortLabel: 'Detalhes' },
  { id: 'tiles', label: 'Blocos', shortLabel: 'Blocos' },
  { id: 'content', label: 'Conteúdo', shortLabel: 'Conteúdo' },
];

const STORAGE_PREFIX = 'nexus-pessoal-drinks-view';
const DEFAULT_VIEW: DrinkCartaViewMode = 'content';

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function loadDrinkCartaViewMode(userId: string | undefined): DrinkCartaViewMode {
  if (!userId || typeof localStorage === 'undefined') return DEFAULT_VIEW;
  const raw = localStorage.getItem(storageKey(userId));
  if (!raw) return DEFAULT_VIEW;
  return DRINK_CARTA_VIEW_OPTIONS.some((option) => option.id === raw)
    ? (raw as DrinkCartaViewMode)
    : DEFAULT_VIEW;
}

export function saveDrinkCartaViewMode(userId: string, mode: DrinkCartaViewMode): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(storageKey(userId), mode);
  } catch {
    /* quota */
  }
}

export function getDrinkCartaViewOption(mode: DrinkCartaViewMode): DrinkCartaViewOption {
  return DRINK_CARTA_VIEW_OPTIONS.find((option) => option.id === mode) ?? DRINK_CARTA_VIEW_OPTIONS[7];
}
