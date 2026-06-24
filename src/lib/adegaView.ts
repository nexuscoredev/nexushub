import {
  DRINK_CARTA_VIEW_OPTIONS,
  type DrinkCartaViewMode,
} from './drinkCartaView';

export type AdegaViewMode = DrinkCartaViewMode;

export const ADEGA_VIEW_OPTIONS = DRINK_CARTA_VIEW_OPTIONS;

const STORAGE_PREFIX = 'nexus-pessoal-adega-view';
const DEFAULT_VIEW: AdegaViewMode = 'content';

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function loadAdegaViewMode(userId: string | undefined): AdegaViewMode {
  if (!userId || typeof localStorage === 'undefined') return DEFAULT_VIEW;
  const raw = localStorage.getItem(storageKey(userId));
  if (!raw) return DEFAULT_VIEW;
  return ADEGA_VIEW_OPTIONS.some((option) => option.id === raw)
    ? (raw as AdegaViewMode)
    : DEFAULT_VIEW;
}

export function saveAdegaViewMode(userId: string, mode: AdegaViewMode): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(storageKey(userId), mode);
  } catch {
    /* quota */
  }
}

export function getAdegaViewOption(mode: AdegaViewMode) {
  return ADEGA_VIEW_OPTIONS.find((option) => option.id === mode) ?? ADEGA_VIEW_OPTIONS[7];
}
