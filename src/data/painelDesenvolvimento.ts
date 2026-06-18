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

export interface DevPDCAStep {
  id: string;
  letter: string;
  title: string;
  verb: string;
  tool: string;
  summary: string;
}

export const DEV_CHECKLIST_STORAGE_KEY = 'nexushub-dev-checklist-v3';

export const DEV_FLUXO_WHITEBOARD_IMAGE = '/img/dev/fluxo-whiteboard.png';

/** Ciclo PDCA — cada etapa com Cursor (quadro da equipe). */
export const DEV_PDCA_STEPS: DevPDCAStep[] = [
  {
    id: 'plan',
    letter: 'P',
    title: 'Plan',
    verb: 'Planejar',
    tool: 'Cursor',
    summary: 'Escopo, requisitos e desenho da solução antes de codar.',
  },
  {
    id: 'do',
    letter: 'D',
    title: 'Do',
    verb: 'Executar',
    tool: 'Cursor',
    summary: 'Implementação no repositório — features, fixes e integrações.',
  },
  {
    id: 'check',
    letter: 'C',
    title: 'Check',
    verb: 'Conferir',
    tool: 'Cursor',
    summary: 'Build, preview na Vercel e testes dos fluxos críticos.',
  },
  {
    id: 'act',
    letter: 'A',
    title: 'Act',
    verb: 'Ajustar',
    tool: 'Cursor',
    summary: 'Correções, deploy e melhorias a partir do que foi validado.',
  },
];

export const DEV_KANBAN = {
  title: 'Kanban',
  subtitle: 'Controle visual',
  summary:
    'Quadro visível do que está em prospecção, contrato, desenvolvimento, QA e manutenção — use a aba Quadro para desenhar e sincronizar com a equipe.',
};

/** Pipeline comercial → entrega (fluxo do quadro físico). */
export const DEV_PIPELINE_STAGES: DevStage[] = [
  {
    id: 'comerc-mkt',
    order: 1,
    title: 'Comercial / Marketing',
    summary: 'Topo do funil — demanda e posicionamento.',
    tools: ['Comercial'],
    checklist: [
      'Demanda qualificada e registrada',
      'Proposta de valor alinhada ao cliente',
      'Canal e expectativa de prazo claros',
    ],
  },
  {
    id: 'prospec',
    order: 2,
    title: 'Prospecção',
    summary: 'Diagnóstico e encaixe da solução.',
    tools: ['Comercial'],
    checklist: [
      'Reunião ou briefing documentado',
      'Escopo preliminar e riscos mapeados',
      'Próximo passo definido com o cliente',
    ],
  },
  {
    id: 'contrato',
    order: 3,
    title: 'Contrato',
    summary: 'Fechamento — valor (~R$) e entregáveis acordados.',
    tools: ['Comercial'],
    checklist: [
      'Proposta ou contrato assinado',
      'Valor e forma de pagamento definidos',
      'Cronograma de marcos alinhado',
    ],
  },
  {
    id: 'dev-qa',
    order: 4,
    title: 'Dev + QA',
    summary: 'Construção e validação técnica (receita + valor entregue).',
    tools: ['Cursor', 'GitHub', 'Vercel', 'Supabase'],
    checklist: [
      'PDCA aplicado no Cursor (plan → act)',
      'Pull antes de codar; commits feat:/fix:',
      'Build Vercel sem erro de TypeScript',
      'Homologação dos fluxos do escopo',
    ],
  },
  {
    id: 'manut-cx',
    order: 5,
    title: 'Dev. manut. + UX melhoria',
    summary: 'Sustentação, evolução contínua e experiência do usuário.',
    tools: ['Cursor', 'Hub', 'Kanban'],
    checklist: [
      'Bugs e ajustes pós go-live tratados',
      'Melhorias de UX priorizadas no quadro',
      'Cliente informado sobre entregas e próximos passos',
    ],
  },
];

/** Stack técnica — GitHub → Supabase → Vercel → publicação. */
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

/** Pipeline + stack técnica — usado nas checklists. */
export const DEV_ALL_CHECKLIST_STAGES: DevStage[] = [...DEV_PIPELINE_STAGES, ...DEV_STAGES];

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
  {
    id: 'pdca-cursor',
    title: 'PDCA no Cursor',
    description: 'Ciclo por feature ou entrega.',
    tags: ['cursor', 'planejamento'],
    content: `P — Plan: descreva escopo, arquivos e critérios de pronto.
D — Do: implemente com diff mínimo e convenções do repo.
C — Check: npm run build + teste manual no preview.
A — Act: corrija, commite e publique; registre no quadro Kanban.`,
  },
];

export function devChecklistItemKey(stageId: string, index: number): string {
  return `${stageId}:${index}`;
}
