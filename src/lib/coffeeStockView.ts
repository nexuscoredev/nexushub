import {
  DRINK_CARTA_VIEW_OPTIONS,
  type DrinkCartaViewMode,
} from './drinkCartaView';

export type CoffeeStockViewMode = DrinkCartaViewMode;

export const COFFEE_STOCK_VIEW_OPTIONS = DRINK_CARTA_VIEW_OPTIONS;

const STORAGE_PREFIX = 'nexus-pessoal-coffee-stock-view';
const DEFAULT_VIEW: CoffeeStockViewMode = 'content';

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function loadCoffeeStockViewMode(userId: string | undefined): CoffeeStockViewMode {
  if (!userId || typeof localStorage === 'undefined') return DEFAULT_VIEW;
  const raw = localStorage.getItem(storageKey(userId));
  if (!raw) return DEFAULT_VIEW;
  return COFFEE_STOCK_VIEW_OPTIONS.some((option) => option.id === raw)
    ? (raw as CoffeeStockViewMode)
    : DEFAULT_VIEW;
}

export function saveCoffeeStockViewMode(userId: string, mode: CoffeeStockViewMode): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(storageKey(userId), mode);
  } catch {
    /* quota */
  }
}

export function getCoffeeStockViewOption(mode: CoffeeStockViewMode) {
  return COFFEE_STOCK_VIEW_OPTIONS.find((option) => option.id === mode) ?? COFFEE_STOCK_VIEW_OPTIONS[7];
}
