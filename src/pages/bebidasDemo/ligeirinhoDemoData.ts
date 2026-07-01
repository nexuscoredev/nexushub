import type { CSSProperties } from 'react';

export interface LigeirinhoDemoMenuItem {
  id: string;
  titulo: string;
  icone: string;
}

export interface LigeirinhoDemoMenuGrupo {
  titulo: string;
  itens: LigeirinhoDemoMenuItem[];
}

export interface LigeirinhoDemoApp {
  id: string;
  nome: string;
  icone: string;
  iconeLabel?: string;
  corAccent: string;
  gradient: string;
  grupos: LigeirinhoDemoMenuGrupo[];
}

export const DEMO_USER_NAME = 'Felipe';
export const DEMO_USER_CARGO = 'Desenvolvedor';
export const DEMO_VERSION = 'L 0.1.0';
export const DEMO_MARCA = 'Ligeirinho Bebidas';

export const HUB_NAV_ITEMS = [
  { id: 'bem-vindo', titulo: 'Bem-vindo', icone: '👋' },
  { id: 'dashboard', titulo: 'Dashboard', icone: '📊' },
] as const;

export const HUB_ADMIN_MODULOS = [
  { titulo: 'Visão geral', icone: '🧭' },
  { titulo: 'Visão Estratégica', icone: '🎯' },
  { titulo: 'Histórico', icone: '📜' },
] as const;

export const APPS_SISTEMA_DEMO: LigeirinhoDemoApp[] = [
  {
    id: 'operacional',
    nome: 'Operacional',
    icone: '⚡',
    iconeLabel: 'OPS',
    corAccent: '#ef4444',
    gradient:
      'radial-gradient(ellipse 95% 70% at 92% 0%, rgba(239,68,68,0.34) 0%, transparent 50%), radial-gradient(ellipse 55% 45% at 0% 80%, rgba(239,68,68,0.1) 0%, transparent 42%)',
    grupos: [
      {
        titulo: 'Filas',
        itens: [
          { id: 'pedidos', titulo: 'Pedidos', icone: '📦' },
          { id: 'roteirizacao', titulo: 'Roteirização', icone: '🗺️' },
          { id: 'separacao', titulo: 'Separação', icone: '⚡' },
          { id: 'entregas', titulo: 'Entregas', icone: '📍' },
          { id: 'ocorrencias', titulo: 'Central de Ocorrências', icone: '🚨' },
          { id: 'organograma', titulo: 'Organograma', icone: '🗂️' },
        ],
      },
      {
        titulo: 'Cadastros',
        itens: [
          { id: 'cadastros', titulo: 'Cadastros', icone: '👥' },
          { id: 'produtos', titulo: 'Produtos', icone: '🍺' },
          { id: 'etiquetas', titulo: 'Etiquetas', icone: '🏷️' },
          { id: 'promocao', titulo: 'Promoção', icone: '🏷' },
        ],
      },
      {
        titulo: 'Logística',
        itens: [
          { id: 'motoristas', titulo: 'Motoristas', icone: '🚚' },
          { id: 'veiculos', titulo: 'Veículos', icone: '🚛' },
        ],
      },
    ],
  },
  {
    id: 'estoque',
    nome: 'Estoque',
    icone: '📦',
    iconeLabel: 'EST',
    corAccent: '#ac8e68',
    gradient:
      'radial-gradient(ellipse 95% 70% at 90% 0%, rgba(172,142,104,0.32) 0%, transparent 52%), radial-gradient(ellipse 55% 45% at 0% 85%, rgba(172,142,104,0.1) 0%, transparent 42%)',
    grupos: [
      {
        titulo: 'Visão',
        itens: [
          { id: 'painel', titulo: 'Painel', icone: '📦' },
          { id: 'tv-alertas', titulo: 'TV Alertas', icone: '📺' },
          { id: 'saldos', titulo: 'Saldos', icone: '📊' },
        ],
      },
      {
        titulo: 'Movimentação',
        itens: [
          { id: 'movimentos', titulo: 'Movimentos', icone: '🔄' },
          { id: 'lotes', titulo: 'Lotes', icone: '🏷️' },
          { id: 'entrada-xml', titulo: 'Entrada XML', icone: '📄' },
        ],
      },
      {
        titulo: 'Inventário',
        itens: [
          { id: 'inventario', titulo: 'Inventário', icone: '📋' },
          { id: 'inventario-app', titulo: 'Inventário app', icone: '📱' },
        ],
      },
    ],
  },
  {
    id: 'departamento',
    nome: 'Departamento',
    icone: '👥',
    iconeLabel: 'RH',
    corAccent: '#6366f1',
    gradient:
      'radial-gradient(ellipse 95% 70% at 90% 0%, rgba(99,102,241,0.32) 0%, transparent 52%), radial-gradient(ellipse 55% 45% at 0% 85%, rgba(99,102,241,0.1) 0%, transparent 42%)',
    grupos: [
      {
        titulo: 'Equipe',
        itens: [
          { id: 'painel', titulo: 'Painel', icone: '👥' },
          { id: 'colaboradores', titulo: 'Colaboradores', icone: '🧑‍💼' },
          { id: 'organograma', titulo: 'Organograma', icone: '🗂️' },
          { id: 'cargos', titulo: 'Cargos e acessos', icone: '🔐' },
        ],
      },
      {
        titulo: 'Gestão',
        itens: [
          { id: 'admissao', titulo: 'Admissão', icone: '📝' },
          { id: 'incentivos', titulo: 'Comissões e vales', icone: '🎯' },
          { id: 'documentos', titulo: 'Documentos RH', icone: '📁' },
        ],
      },
    ],
  },
];

export const DEMO_MENU_ITEM_INICIAL = 'operacional:Filas:separacao';

export function menuItemKey(appId: string, grupo: string, itemId: string) {
  return `${appId}:${grupo}:${itemId}`;
}

export function resolveMenuItem(key: string) {
  const [appId, grupo, itemId] = key.split(':');
  const app = APPS_SISTEMA_DEMO.find((a) => a.id === appId);
  if (!app || !grupo || !itemId) return null;
  const grupoObj = app.grupos.find((g) => g.titulo === grupo);
  const item = grupoObj?.itens.find((i) => i.id === itemId);
  if (!grupoObj || !item) return null;
  return { app, grupo: grupoObj, item };
}

export const WELCOME_SHORTCUTS = [
  { id: 'dashboard', titulo: 'Dashboard', icone: '📊' },
  { id: 'config', titulo: 'Configurações', icone: '⚙️' },
  { id: 'operacional', titulo: 'Separação', icone: '⚡' },
  { id: 'requests', titulo: 'Solicitações', icone: '💬' },
] as const;

export const WELCOME_SUGGESTIONS = [
  {
    icone: '🧠',
    titulo: 'Aprendizado contínuo',
    texto: 'Reserve um bloco para explorar uma melhoria ou correção que impacte várias áreas.',
  },
  {
    icone: '📝',
    titulo: 'Comunicar mudanças',
    texto: 'Toda alteração visível merece entrada em Novidades — a equipe agradece.',
    rotuloLink: 'Configurações',
  },
] as const;

export const WELCOME_META_DIA = 'Documentar uma decisão técnica para o time.';
export const WELCOME_CTA = 'Ver fila de separação';

export function temaApp(app: LigeirinhoDemoApp): CSSProperties {
  const accent = app.corAccent;
  return {
    '--app-accent': accent,
    '--app-accent-soft': `${accent}26`,
    '--app-accent-border': `${accent}40`,
    '--app-accent-glow': `${accent}55`,
    '--app-gradient': app.gradient,
  } as CSSProperties;
}

export function saudacaoPorHorario(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function dataAtualFormatada(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
}
