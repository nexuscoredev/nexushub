import type { DemoId } from './sistemaDemoCatalog';

export interface SistemaDemoCard {
  id: string;
  demoId: DemoId;
  title: string;
  description: string;
  category: string;
  icon: string;
  accent: string;
  accentSoft: string;
  modules: string[];
}

export const SISTEMAS_DEMOS: SistemaDemoCard[] = [
  {
    id: 'demo-coleta-residuos',
    demoId: 'coleta',
    title: 'Coleta de resíduos',
    description:
      'Fluxo operacional com programação, MTR, clientes por segmento e painel gerencial — exemplo do portfólio NEXUS.',
    category: 'Portfólio',
    icon: 'recycling',
    accent: '#22c55e',
    accentSoft: 'rgba(34, 197, 94, 0.14)',
    modules: ['Início', 'Dashboard', 'Programação', 'MTR', 'Clientes'],
  },
  {
    id: 'demo-ligeirinho-hub',
    demoId: 'ligeirinho',
    title: 'Sistema de bebidas',
    description:
      'PDV, pedidos, estoque e painel gerencial para operação de bebidas — exemplo do portfólio NEXUS.',
    category: 'Portfólio',
    icon: 'local_bar',
    accent: '#fbbf24',
    accentSoft: 'rgba(251, 191, 36, 0.16)',
    modules: ['Início', 'Dashboard', 'PDV', 'Pedidos', 'Estoque'],
  },
];
