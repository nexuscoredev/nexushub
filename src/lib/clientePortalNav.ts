export type ClientePortalNavItem = {
  href: string;
  label: string;
};

export const CLIENTE_PORTAL_NAV: ClientePortalNavItem[] = [
  { href: '#inicio', label: 'Início' },
  { href: '#jornada', label: 'Jornada' },
  { href: '#novidades', label: 'Novidades' },
  { href: '#contato', label: 'Contato' },
  { href: '#documentos', label: 'Documentos' },
];

export const CLIENTE_PORTAL_NAV_LIGEIRINHO: ClientePortalNavItem[] = [
  { href: '#inicio', label: 'Início' },
  { href: '#status-hoje', label: 'Hoje' },
  { href: '#hub', label: 'Hub' },
  { href: '#parceiros', label: 'Parceiros' },
  { href: '#jornada', label: 'Jornada' },
  { href: '#novidades', label: 'Histórico' },
  { href: '#contato', label: 'Contato' },
  { href: '#documentos', label: 'Documentos' },
];
