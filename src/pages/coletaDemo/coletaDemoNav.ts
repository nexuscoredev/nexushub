export type ColetaDemoScreen =
  | 'inicio'
  | 'dashboard'
  | 'programacao'
  | 'mtr'
  | 'motoristas'
  | 'representantes'
  | 'veiculos'
  | 'clientes'
  | 'preview';

export interface ColetaMenuLeaf {
  id: ColetaDemoScreen;
  label: string;
}

export interface ColetaMenuBranch {
  label: string;
  children: ColetaMenuLeaf[];
}

export type ColetaMenuItem = ColetaMenuLeaf | ColetaMenuBranch;

export interface ColetaMenuGroup {
  title: string;
  items: ColetaMenuItem[];
}

export function isColetaMenuBranch(item: ColetaMenuItem): item is ColetaMenuBranch {
  return 'children' in item;
}

export const COLETA_MENU_GROUPS: ColetaMenuGroup[] = [
  {
    title: 'Visão geral',
    items: [
      { id: 'inicio', label: 'Bem-vindo' },
      { id: 'dashboard', label: 'Dashboard' },
    ],
  },
  {
    title: 'Cadastros',
    items: [
      { id: 'clientes', label: 'Gerenciador' },
      { id: 'motoristas', label: 'Motoristas' },
      { id: 'representantes', label: 'Representantes comerciais' },
      { id: 'veiculos', label: 'Veículos' },
    ],
  },
  {
    title: 'Fluxo operacional',
    items: [
      { id: 'programacao', label: 'Programações' },
      { id: 'mtr', label: 'MTR' },
    ],
  },
];

export const COLETA_SCREEN_TITLES: Record<ColetaDemoScreen, string> = {
  inicio: 'Bem-vindo',
  dashboard: 'Relatório Gerencial',
  programacao: 'Calendário das programações de Coleta',
  mtr: 'MTR',
  motoristas: 'Motoristas e documentação (CNH)',
  representantes: 'Representantes comerciais',
  veiculos: 'Veículos',
  clientes: 'Gerenciador',
  preview: 'Módulo demonstrativo',
};
