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

export const DEV_CHECKLIST_STORAGE_KEY = 'nexushub-dev-checklist-v1';

export const DEV_STAGES: DevStage[] = [
  {
    id: 'github',
    order: 1,
    title: 'GitHub',
    summary: 'Repositório versionado em disco local — nunca OneDrive/Drive como fonte.',
    tools: ['GitHub', 'Git'],
    checklist: [
      'Repositório criado em github.com/nexuscoredev',
      'Clone em C:\\dev\\NEXUS\\ ou ~/dev/',
      'Branch main protegida (fluxo acordado com o time)',
      'CI com npm run build (.github/workflows)',
      '.gitignore com .env, node_modules, .vercel',
    ],
  },
  {
    id: 'supabase',
    order: 2,
    title: 'Supabase',
    summary: 'Banco, Auth e RLS — migrations na ordem, seed só com service role.',
    tools: ['Supabase', 'SQL Editor', 'CLI'],
    checklist: [
      'Projeto Supabase criado (região us-west-2 ou acordada)',
      'Migrations em supabase/migrations/ aplicadas na ordem',
      'RLS habilitado nas tabelas sensíveis',
      'VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY anotadas',
      'Seed de usuários com npm run seed:users (service role local)',
      'Storage buckets e políticas, se o projeto usar upload',
    ],
  },
  {
    id: 'vercel',
    order: 3,
    title: 'Vercel',
    summary: 'Deploy contínuo a partir do main — variáveis sem prefixo VITE_ para secrets.',
    tools: ['Vercel', 'Time NEXUS'],
    checklist: [
      'Projeto linkado ao repositório GitHub',
      'Framework Vite — build: npm run build, output: dist',
      'VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em Production',
      'Secrets de API (Todoist, Google JSON) sem VITE_',
      'Primeiro deploy verde e URL de preview testada',
      'Domínio customizado, se aplicável',
    ],
  },
  {
    id: 'cursor',
    order: 4,
    title: 'Cursor',
    summary: 'Ambiente local e regras para a IA seguir o padrão NEXUS.',
    tools: ['Cursor', 'Node.js'],
    checklist: [
      'Pasta aberta no Cursor (workspace local)',
      'git pull origin main + npm install',
      'cp .env.example .env.local preenchido',
      'Plugins Supabase/Vercel conectados, se usar MCP',
      'Regras em .cursor/rules/ revisadas para o projeto',
      'npm run dev funcionando em localhost:3000',
    ],
  },
  {
    id: 'build',
    order: 5,
    title: 'Desenvolvimento',
    summary: 'Codar em main (fluxo NEXUS): pull antes, commit claro, push após pull.',
    tools: ['Git', 'Todoist', 'Hub'],
    checklist: [
      'git pull origin main antes de cada sessão',
      'npm install se package-lock.json mudou',
      'Tarefas na Fila operacional atualizadas',
      'Commits feat:/fix: com mensagem clara',
      'git pull --rebase origin main antes do push',
      'Sem .env ou secrets no Git',
    ],
  },
  {
    id: 'qa',
    order: 6,
    title: 'Homologação',
    summary: 'Validar preview Vercel com dados reais ou staging antes do go-live.',
    tools: ['Vercel Preview', 'Hub'],
    checklist: [
      'Build de preview sem erro',
      'Login, fluxos críticos e mobile testados',
      'Integrações (Todoist, Calendar, Supabase) ok em preview',
      'Cliente ou sócio aprovou homologação',
      'Checklist de segurança (RLS, rotas protegidas)',
    ],
  },
  {
    id: 'golive',
    order: 7,
    title: 'Go-live',
    summary: 'Promover produção, registrar no Hub e passar operação.',
    tools: ['Vercel', 'Hub — Sistemas'],
    checklist: [
      'Deploy production promovido / merge em main',
      'Variáveis de Production conferidas',
      'Sistema cadastrado em Hub → Sistemas (URL, logo)',
      'Senhas padrão de seed alteradas em produção',
      'Documentação entregue ao cliente, se contratado',
      'Monitoramento inicial (logs Vercel / Supabase)',
    ],
  },
];

export const DEV_SNIPPETS: DevSnippet[] = [
  {
    id: 'antes-codar',
    title: 'Antes de codar (fluxo NEXUS)',
    description: 'Rodar sempre no início da sessão.',
    tags: ['git', 'local'],
    content: `git pull origin main
npm install`,
  },
  {
    id: 'publicar',
    title: 'Publicar no main',
    description: 'Depois de commitar localmente.',
    tags: ['git', 'deploy'],
    content: `git pull --rebase origin main
git push origin main`,
  },
  {
    id: 'setup-local',
    title: 'Setup local do Hub',
    description: 'Primeiro clone do nexushub ou projeto similar.',
    tags: ['local', 'cursor'],
    content: `git clone https://github.com/nexuscoredev/nexushub.git
cd nexushub
npm install
cp .env.example .env.local
npm run dev`,
  },
  {
    id: 'seed-users',
    title: 'Seed usuários Supabase',
    description: 'Só na máquina local — nunca commitar service role.',
    tags: ['supabase'],
    content: `$env:SUPABASE_URL="https://SEU_PROJETO.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="sua_service_role"
npm run seed:users`,
  },
  {
    id: 'cursor-novo-projeto',
    title: 'Prompt Cursor — novo projeto NEXUS',
    description: 'Colar no chat ao iniciar um sistema sob medida.',
    tags: ['cursor'],
    content: `Novo projeto NEXUS Technology Systems.

Stack: React + TypeScript + Vite, Supabase (Auth + Postgres + RLS), deploy Vercel (time NEXUS).

Antes de codar:
1. git pull origin main
2. npm install se package-lock mudou

Convenções:
- Trabalhar em main (sem branch/PR, salvo combinação contrária)
- Commits feat: / fix:
- Nunca commitar .env
- UI dark NEXUS (tokens do design system)
- Português pt-BR

Crie a estrutura inicial: rotas, auth Supabase, layout dashboard e README com setup.`,
  },
  {
    id: 'vercel-env',
    title: 'Variáveis Vercel (referência Hub)',
    description: 'Copiar nomes — preencher valores no dashboard.',
    tags: ['vercel', 'supabase'],
    content: `VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
TODOIST_API_TOKEN=
TODOIST_PROJECT_ID=
GOOGLE_SERVICE_ACCOUNT_JSON=
GOOGLE_CALENDAR_ID_VINICIUS=
GOOGLE_CALENDAR_ID_RAFAEL=`,
  },
  {
    id: 'migrations-ordem',
    title: 'Ordem migrations Supabase (Hub)',
    description: 'SQL Editor — um arquivo por vez.',
    tags: ['supabase'],
    content: `supabase/migrations/20260602100000_initial_schema.sql
supabase/migrations/20260602100001_rls_policies.sql
supabase/migrations/20260602100002_seed_data.sql
(... demais arquivos na ordem numérica do timestamp)`,
  },
];

export function devChecklistItemKey(stageId: string, index: number): string {
  return `${stageId}:${index}`;
}
