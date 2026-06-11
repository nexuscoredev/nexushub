export interface DevStage {
  id: string;
  order: number;
  title: string;
  summary: string;
  tools: string[];
  checklist: string[];
}

export interface DevSnippet {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
}

export const DEV_CHECKLIST_STORAGE_KEY = 'nexushub-dev-checklist-v2';

export const DEV_STAGES: DevStage[] = [
  {
    id: 'github',
    order: 1,
    title: 'GitHub',
    summary: 'Repo local — código só via Git.',
    tools: ['GitHub'],
    checklist: [
      'Repo em github.com/nexuscoredev',
      'Clone em disco local',
      '.gitignore com .env',
    ],
  },
  {
    id: 'supabase',
    order: 2,
    title: 'Supabase',
    summary: 'Banco, auth e RLS.',
    tools: ['Supabase'],
    checklist: [
      'Migrations na ordem',
      'RLS habilitado',
      'VITE_SUPABASE_* no .env.local',
    ],
  },
  {
    id: 'vercel',
    order: 3,
    title: 'Vercel',
    summary: 'Deploy do main.',
    tools: ['Vercel'],
    checklist: ['Linkado ao GitHub', 'Env vars ok', 'Preview testado'],
  },
  {
    id: 'cursor',
    order: 4,
    title: 'Cursor',
    summary: 'Ambiente local pronto.',
    tools: ['Cursor'],
    checklist: ['pull + npm install', '.env.local ok', 'npm run dev ok'],
  },
  {
    id: 'build',
    order: 5,
    title: 'Desenvolvimento',
    summary: 'Main: pull → commit → push.',
    tools: ['Git'],
    checklist: ['pull antes de codar', 'Commits feat:/fix:', 'Sem .env no Git'],
  },
  {
    id: 'qa',
    order: 6,
    title: 'Homologação',
    summary: 'Validar preview.',
    tools: ['Vercel'],
    checklist: ['Build ok', 'Fluxos críticos testados'],
  },
  {
    id: 'golive',
    order: 7,
    title: 'Go-live',
    summary: 'Produção + Hub.',
    tools: ['Vercel', 'Hub'],
    checklist: ['Production no ar', 'Cadastro em Sistemas'],
  },
];

export const DEV_SNIPPETS: DevSnippet[] = [
  {
    id: 'antes-codar',
    title: 'Antes de codar',
    description: 'Início de sessão.',
    tags: ['git'],
    content: `git pull origin main
npm install`,
  },
  {
    id: 'publicar',
    title: 'Publicar',
    description: 'Enviar para main.',
    tags: ['git'],
    content: `git pull --rebase origin main
git push origin main`,
  },
  {
    id: 'setup-local',
    title: 'Setup local',
    description: 'Primeiro clone.',
    tags: ['local'],
    content: `git clone https://github.com/nexuscoredev/nexushub.git
cd nexushub
npm install
cp .env.example .env.local
npm run dev`,
  },
  {
    id: 'cursor-novo-projeto',
    title: 'Prompt Cursor — projeto NEXUS',
    description: 'Sistema novo.',
    tags: ['cursor'],
    content: `Stack: React + TS + Vite, Supabase, Vercel.
Fluxo: main, feat/fix, sem .env no Git.
UI dark NEXUS, pt-BR.

Crie rotas, auth e layout dashboard.`,
  },
];

export function devChecklistItemKey(stageId: string, index: number): string {
  return `${stageId}:${index}`;
}
