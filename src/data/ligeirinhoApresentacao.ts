export const LIGEIRINHO_APRESENTACAO_PDF = '/docs/ligeirinho/apresentacao-ligeirinho.pdf';

export interface LigeirinhoApresentacaoSlide {
  id: string;
  title: string;
  eyebrow?: string;
  lead?: string;
  bullets?: string[];
  quote?: string;
  columns?: { title: string; items: string[]; tone?: 'muted' | 'accent' }[];
  stats?: { label: string; value: string }[];
  phases?: { label: string; text: string }[];
  demoTarget?: 'pdv' | 'pedidos' | 'dashboard';
}

export const LIGEIRINHO_APRESENTACAO_SLIDES: LigeirinhoApresentacaoSlide[] = [
  {
    id: '1',
    title: 'Ligeirinho Hub',
    eyebrow: 'Desenvolvido por NEXUS · Sua marca · Seu sistema',
    lead: 'O sistema da adega com a cara da Ligeirinho — não pacote genérico de prateleira.',
    bullets: ['PDV · Totem · App · Entregas'],
    stats: [
      { value: '100%', label: 'sob medida' },
      { value: '1', label: 'hub integrado' },
      { value: '0', label: 'adaptação forçada' },
    ],
  },
  {
    id: '2',
    title: 'Quem desenvolve · NEXUS',
    eyebrow: 'NEXUS Technology Systems',
    lead: 'Inteligência artificial · Automação · Sistemas · Integração',
    columns: [
      {
        title: 'Sob medida',
        items: ['Cada módulo nasce da sua necessidade'],
      },
      {
        title: 'Integração',
        items: ['Cayena, Active, WhatsApp — um hub'],
      },
      {
        title: 'Escalável',
        items: ['Cresce com a frota e novas lojas'],
      },
      {
        title: 'Eficiência',
        items: ['Menos retrabalho, mais controle'],
      },
    ],
    quote: 'Seu sistema não deve se adaptar ao negócio. O sistema deve ser feito para ele. — NEXUS',
  },
  {
    id: '3',
    title: 'O que você pediu',
    lead: 'Troca do sistema da loja. Sem improviso.',
    bullets: [
      'PDV — caixa e controle na loja',
      'Totem em tablet — autoatendimento na loja',
      'App da equipe — receber e despachar pedidos',
      'Fluxo Cayena + frota — do pedido ao motorista',
    ],
    quote: 'A NEXUS já começou pela logística. Agora entregamos a frente completa.',
  },
  {
    id: '4',
    title: 'A verdade do mercado',
    lead: 'Os outros sistemas são patos.',
    bullets: [
      'Pato na loja não anda direito. Pato na água não sabe nadar no seu rio.',
      'Sistema genérico na sua adega — mesma coisa.',
    ],
  },
  {
    id: '5',
    title: 'Comparativo',
    lead: 'Prateleira vs NEXUS',
    columns: [
      {
        title: 'Sistemas “de caixinha”',
        tone: 'muted',
        items: [
          'Cayena / marketplaces — canal B2B, não é PDV da sua loja',
          'Anota AI / cardápio — só delivery; loja offline, outro app',
          'PDV genérico — você muda o processo para caber no software',
          'Totem engessado — layout fixo, sem identidade Ligeirinho',
          '5 ferramentas — WhatsApp + planilha + 3 sistemas',
        ],
      },
      {
        title: 'Ligeirinho Hub · NEXUS',
        tone: 'accent',
        items: [
          'Feito para a Ligeirinho — categorias, combos e regras suas',
          'PDV + Totem + App — mesma base, um pedido, um ID',
          'Tablet nativo — totem no navegador, atualiza remoto',
          'Integração real — Cayena → rota → Active (já rodando)',
          'Evolui com você — pediu módulo novo? A gente constrói',
        ],
      },
    ],
  },
  {
    id: '6',
    title: 'Arquitetura',
    lead: 'Um ecossistema. Flexível por design.',
    bullets: ['PDV → Totem → App → NEXUS Hub → Active Entregas'],
    quote:
      'Você não compra licença engessada — contrata evolução. Amanhã é segunda loja, PIX no totem ou relatório novo: o sistema acompanha.',
  },
  {
    id: '7',
    title: 'Módulo · PDV',
    lead: 'Ligeirinho PDV — caixa rápido na loja.',
    demoTarget: 'pdv',
  },
  {
    id: '8',
    title: 'Módulo · Totem',
    lead: 'Ligeirinho Totem — autoatendimento em tablet na loja.',
    demoTarget: 'pdv',
  },
  {
    id: '9',
    title: 'Módulo · App',
    lead: 'Ligeirinho Operacional — equipe recebe e despacha pedidos.',
    demoTarget: 'pedidos',
  },
  {
    id: '10',
    title: 'Prova real',
    lead: 'Já está rodando na Ligeirinho.',
    columns: [
      {
        title: 'Automação Gmail',
        items: ['Pedidos Cayena → planilha central sem digitar.'],
      },
      {
        title: 'Roteirização IA',
        items: ['Status sincronizados · trava anti-duplicidade.'],
      },
      {
        title: 'Active Entregas',
        items: ['Importação diária automática para motoristas.'],
      },
    ],
    quote: 'Isso é NEXUS na prática — não slide de vendedor de pato.',
  },
  {
    id: '11',
    title: 'Próximo passo',
    lead: 'Implantação 30 dias',
    phases: [
      { label: 'Semana 1 (dias 1–7)', text: 'Mapeamento da operação + PDV e cardápio sob medida' },
      { label: 'Semana 2 (dias 8–14)', text: 'Totem em tablet + fluxo de autoatendimento na loja' },
      { label: 'Semana 3 (dias 15–21)', text: 'App da equipe + integração Cayena, rota e Active Entregas' },
      { label: 'Semana 4 (dias 22–30)', text: 'Testes com a equipe, ajustes finos, treinamento e go-live' },
    ],
  },
];
