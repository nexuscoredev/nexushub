export type CoffeeCapsuleSystem = 'dolce-gusto' | 'tres-coracoes';

const CAPSULE_SITES: Record<CoffeeCapsuleSystem, string> = {
  'dolce-gusto': 'nescafe-dolcegusto.com.br',
  'tres-coracoes': 'cafe3coracoes.com.br',
};

const BRAND_HINTS: Record<CoffeeCapsuleSystem, string> = {
  'dolce-gusto': 'dolce gusto',
  'tres-coracoes': 'três corações',
};

export function parseCoffeeCapsuleSystem(value: string | undefined): CoffeeCapsuleSystem | null {
  if (value === 'dolce-gusto' || value === 'tres-coracoes') return value;
  return null;
}

export function coffeeCapsuleSite(system: CoffeeCapsuleSystem): string {
  return CAPSULE_SITES[system];
}

export function coffeeCapsuleBrandHint(system: CoffeeCapsuleSystem): string {
  return BRAND_HINTS[system];
}
