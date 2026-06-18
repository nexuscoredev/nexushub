import type { NavIconName } from '../components/NavIcon';

export type HubNavZone = 'principal' | 'mais';

export interface HubNavItemDef {
  to: string;
  label: string;
  icon: NavIconName;
  zone: HubNavZone;
  /** Exige permissão de finanças/agenda */
  finance?: boolean;
  /** Exige permissão de gestão */
  gestao?: boolean;
  /** Exige permissão de cofre */
  cofre?: boolean;
}

export const HUB_NAV_ITEMS: HubNavItemDef[] = [
  { to: '/dashboard', label: 'Painel', icon: 'dashboard', zone: 'principal' },
  { to: '/agenda', label: 'Agenda', icon: 'calendar', zone: 'principal', finance: true },
  { to: '/financeiro', label: 'Financeiro', icon: 'finance', zone: 'principal', finance: true },
  { to: '/fila', label: 'Fila', icon: 'queue', zone: 'principal' },
  { to: '/sistemas', label: 'Sistemas', icon: 'systems', zone: 'principal' },
  { to: '/usuarios', label: 'Usuários', icon: 'users', zone: 'mais', gestao: true },
  { to: '/cofre', label: 'Cofre', icon: 'vault', zone: 'mais', cofre: true },
  { to: '/configuracoes', label: 'Configurações', icon: 'settings', zone: 'mais' },
  { to: '/desenvolvimento', label: 'Desenvolvimento', icon: 'dev', zone: 'mais' },
];

export interface HubNavPermissions {
  finance: boolean;
  gestao: boolean;
  cofre: boolean;
}

export interface HubNavItem extends HubNavItemDef {
  id: string;
}

export function resolveHubNavItems(perms: HubNavPermissions): {
  principal: HubNavItem[];
  mais: HubNavItem[];
} {
  const principal: HubNavItem[] = [];
  const mais: HubNavItem[] = [];

  for (const item of HUB_NAV_ITEMS) {
    if (item.finance && !perms.finance) continue;
    if (item.gestao && !perms.gestao) continue;
    if (item.cofre && !perms.cofre) continue;
    const resolved = { ...item, id: item.to };
    if (item.zone === 'principal') principal.push(resolved);
    else mais.push(resolved);
  }

  return { principal, mais };
}

export function isHubNavActive(pathname: string, to: string): boolean {
  if (to === '/dashboard') return pathname === '/dashboard';
  return pathname === to || pathname.startsWith(`${to}/`);
}
