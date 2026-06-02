/** Logos placeholder — substituir por assets oficiais de cada produto em public/img/systems/ */
const SYSTEM_LOGOS: Record<string, string> = {
  'rh-ambiental': '/img/systems/rh-ambiental.svg',
  ligeirinho: '/img/systems/ligeirinho.svg',
  contabil: '/img/systems/contabil.svg',
};

export function systemLogoUrl(systemId: string): string {
  return SYSTEM_LOGOS[systemId] ?? '/img/favicon.png';
}
