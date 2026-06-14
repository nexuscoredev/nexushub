/** Atualize ao publicar novidades — controla o indicador “novo” no botão. */
export const HUB_NOVIDADES_VERSION = '2026-06-02-v1';

export const HUB_NOVIDADES_STORAGE_KEY = 'nexushub-novidades-visto';

export type NovidadeArea = 'Geral' | 'Mobile' | 'Fila' | 'Financeiro' | 'Todoist' | 'Perfil';

export interface NovidadeItem {
  title: string;
  description: string;
  area?: NovidadeArea;
}

export interface NovidadeRelease {
  id: string;
  dateLabel: string;
  title: string;
  items: NovidadeItem[];
}

export const HUB_NOVIDADES: NovidadeRelease[] = [
  {
    id: '2026-06-02',
    dateLabel: 'Junho 2026',
    title: 'Notificações da equipe e atualizações do app',
    items: [
      {
        area: 'Geral',
        title: 'Sino de notificações no Hub',
        description:
          'Avisos internos aparecem no sino ao lado do avatar, com contador de não lidas e atualização em tempo real. Gestão envia em Configurações → Notificações da equipe.',
      },
      {
        area: 'Geral',
        title: 'Atualizar sem reinstalar o app',
        description:
          'Depois de um deploy, toque em “Atualizar agora” se o aviso aparecer — não precisa desinstalar o app. Reinstale só se o ícone ou a página inicial estiverem errados (comum no iPhone).',
      },
      {
        area: 'Mobile',
        title: 'App NEXUS na tela inicial',
        description:
          'O atalho instalado abre o site institucional. Para o painel da equipe, acesse o Hub pelo navegador e faça login.',
      },
    ],
  },
  {
    id: '2025-06-02',
    dateLabel: 'Junho 2025',
    title: 'Fila mais rápida e novidades no Todoist',
    items: [
      {
        area: 'Geral',
        title: 'Atualizar agora quando houver nova versão',
        description:
          'O Hub avisa quando um deploy novo está no ar. Use “Atualizar agora” para recarregar com a versão mais recente, sem precisar limpar o cache manualmente.',
      },
      {
        area: 'Fila',
        title: 'Fila operacional mais rápida',
        description:
          'Carregamento inicial só com tarefas ativas; concluídas ao expandir a seção. Edições na tarefa atualizam a lista sem recarregar tudo.',
      },
      {
        area: 'Todoist',
        title: 'Criar tarefa com linguagem natural',
        description:
          'No modal Nova tarefa, digite tudo no título — ex.: “Planejar rotina p1 dia 25 de junho”. Prioridade, prazo e etiquetas são interpretados como no Todoist.',
      },
      {
        area: 'Todoist',
        title: 'Prioridade e responsável corrigidos',
        description:
          'P1–P4 e atribuição de responsável agora sincronizam corretamente com o Todoist ao criar e editar tarefas.',
      },
      {
        area: 'Todoist',
        title: 'Prazos em português',
        description:
          'Exibição de datas como Hoje, Amanhã e “dia 25 de junho” em português; criação de prazo com hoje/amanhã em PT.',
      },
    ],
  },
  {
    id: '2025-06-01',
    dateLabel: 'Junho 2025',
    title: 'Mobile e Financeiro',
    items: [
      {
        area: 'Mobile',
        title: 'Menu hambúrguer no celular',
        description:
          'Navegação em drawer lateral com toque, fechar com X ou toque fora, e área segura para notch.',
      },
      {
        area: 'Mobile',
        title: 'Painel otimizado para celular',
        description:
          'Barra de comando compacta, navegação horizontal com snap, alvos de toque de 44px e conteúdo com safe-area.',
      },
      {
        area: 'Financeiro',
        title: 'Financeiro responsivo',
        description:
          'Tabelas viram cards no mobile, KPIs em coluna e formulários confortáveis para toque.',
      },
      {
        area: 'Geral',
        title: 'Ajustes responsivos em todo o Hub',
        description:
          'Tabelas com scroll, KPIs que quebram linha e botões que não esticam indevidamente em telas pequenas.',
      },
    ],
  },
  {
    id: '2025-05',
    dateLabel: 'Maio 2025',
    title: 'Perfil e identidade NEXUS',
    items: [
      {
        area: 'Perfil',
        title: 'Página Meu perfil',
        description:
          'Foto de perfil, nome e alteração de senha em /perfil, com avatar na barra superior.',
      },
      {
        area: 'Fila',
        title: 'Prioridades com cores P1–P4',
        description:
          'Tags vermelho (urgente), amarelo, verde e cinza na fila e no detalhe da tarefa.',
      },
      {
        area: 'Geral',
        title: 'Logo e visual NEXUS',
        description:
          'Identidade visual unificada na landing, login e painel interno.',
      },
    ],
  },
];

export function hasUnseenNovidades(): boolean {
  try {
    return localStorage.getItem(HUB_NOVIDADES_STORAGE_KEY) !== HUB_NOVIDADES_VERSION;
  } catch {
    return true;
  }
}

export function markNovidadesSeen(): void {
  try {
    localStorage.setItem(HUB_NOVIDADES_STORAGE_KEY, HUB_NOVIDADES_VERSION);
  } catch {
    /* ignore */
  }
}
