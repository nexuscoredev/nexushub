import {
  DRINK_CARTA_VIEW_OPTIONS,
  type DrinkCartaViewMode,
} from './drinkCartaView';

export type CoffeeCartaViewMode = DrinkCartaViewMode;

export const COFFEE_CARTA_VIEW_OPTIONS = DRINK_CARTA_VIEW_OPTIONS;

const STORAGE_PREFIX = 'nexus-pessoal-coffee-carta-view';
const DEFAULT_VIEW: CoffeeCartaViewMode = 'content';

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function loadCoffeeCartaViewMode(userId: string | undefined): CoffeeCartaViewMode {
  if (!userId || typeof localStorage === 'undefined') return DEFAULT_VIEW;
  const raw = localStorage.getItem(storageKey(userId));
  if (!raw) return DEFAULT_VIEW;
  return COFFEE_CARTA_VIEW_OPTIONS.some((option) => option.id === raw)
    ? (raw as CoffeeCartaViewMode)
    : DEFAULT_VIEW;
}

export function saveCoffeeCartaViewMode(userId: string, mode: CoffeeCartaViewMode): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(storageKey(userId), mode);
  } catch {
    /* quota */
  }
}

export function getCoffeeCartaViewOption(mode: CoffeeCartaViewMode) {
  return COFFEE_CARTA_VIEW_OPTIONS.find((option) => option.id === mode) ?? COFFEE_CARTA_VIEW_OPTIONS[7];
}
