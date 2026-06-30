import type { DemoId } from './sistemaDemoCatalog';

export interface DemoChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
}

export interface DemoChatSuggestion {
  id: string;
  label: string;
  reply: string;
}

const COLETA_SUGGESTIONS: DemoChatSuggestion[] = [
  {
    id: 'programacao',
    label: 'Como funciona a programação?',
    reply:
      'A Programação mostra rotas e coletas do dia com horários e clientes de exemplo. Use o menu lateral para explorar o fluxo operacional.',
  },
  {
    id: 'mtr',
    label: 'O que é o MTR aqui?',
    reply:
      'O MTR (Manifesto de Transporte de Resíduos) lista documentos em etapas como Em andamento, Emitido e Finalizado — exemplo de como o módulo funciona na prática.',
  },
  {
    id: 'dados',
    label: 'Os dados são reais?',
    reply:
      'Não. Este é um exemplo do portfólio NEXUS — nomes, números e rotas são ilustrativos para apresentação comercial.',
  },
];

const LIGEIRINHO_SUGGESTIONS: DemoChatSuggestion[] = [
  {
    id: 'dashboard',
    label: 'O que tem no dashboard?',
    reply:
      'O Dashboard reúne KPIs, gráficos, produtos em destaque e movimentações recentes — visão gerencial para apresentar ao cliente.',
  },
  {
    id: 'pdv',
    label: 'Como testar o PDV?',
    reply:
      'Vá em PDV, toque nos produtos para adicionar ao carrinho e finalize uma venda. Os valores são de exemplo.',
  },
  {
    id: 'dados',
    label: 'É ambiente real?',
    reply:
      'Não. Exemplo interativo do portfólio NEXUS — ideal para reuniões comerciais, sem vínculo com operação real.',
  },
];

export function getDemoChatSuggestions(demoId: DemoId): DemoChatSuggestion[] {
  return demoId === 'ligeirinho' ? LIGEIRINHO_SUGGESTIONS : COLETA_SUGGESTIONS;
}

export function getDemoChatWelcome(demoId: DemoId): string {
  if (demoId === 'ligeirinho') {
    return 'Olá! Sou o assistente do exemplo de sistema de bebidas. Posso orientar sobre PDV, pedidos, estoque e painel.';
  }
  return 'Olá! Sou o assistente do exemplo de coleta de resíduos. Posso explicar programação, MTR, clientes e painel.';
}

export function getDemoChatReply(demoId: DemoId, input: string): string {
  const text = input.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  const suggestions = getDemoChatSuggestions(demoId);

  const matched = suggestions.find((s) => {
    const label = s.label.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
    return text.includes(s.id) || label.includes(text) || text.includes(label.slice(0, 12));
  });
  if (matched) return matched.reply;

  if (demoId === 'coleta') {
    if (text.includes('program') || text.includes('rota') || text.includes('coleta')) {
      return COLETA_SUGGESTIONS[0].reply;
    }
    if (text.includes('mtr') || text.includes('manifesto')) {
      return COLETA_SUGGESTIONS[1].reply;
    }
    if (text.includes('cliente') || text.includes('segmento') || text.includes('industrial')) {
      return 'Na aba Clientes você vê cadastros por segmento (Industrial, Hospitalar, Laboratorial e Comercial) com região, periodicidade e perfil de resíduo — todos fictícios para demonstração.';
    }
    if (text.includes('dashboard') || text.includes('grafico') || text.includes('kpi')) {
      return 'O Dashboard reúne KPIs, gráfico de evolução, coletas da semana, frota e eventos recentes. Os números são ilustrativos para mostrar o potencial do painel gerencial.';
    }
  }

  if (demoId === 'ligeirinho') {
    if (text.includes('dashboard') || text.includes('grafico') || text.includes('kpi') || text.includes('venda')) {
      return LIGEIRINHO_SUGGESTIONS[0].reply;
    }
    if (text.includes('pdv') || text.includes('caixa') || text.includes('venda')) {
      return LIGEIRINHO_SUGGESTIONS[1].reply;
    }
    if (text.includes('pedido') || text.includes('fila') || text.includes('estoque')) {
      return 'Use Pedidos para ver a fila operacional e Estoque para saldos e alertas. Nas duas telas, os dados são fictícios e servem para ilustrar o dia a dia da loja.';
    }
  }

  if (
    text.includes('real') ||
    text.includes('fict') ||
    text.includes('demo') ||
    text.includes('verdade') ||
    text.includes('dado')
  ) {
    return suggestions.find((s) => s.id === 'dados')?.reply ?? 'Todos os dados desta demonstração são fictícios e apenas para apresentação.';
  }

  if (text.includes('ola') || text.includes('oi') || text.includes('ajuda') || text.includes('help')) {
    return getDemoChatWelcome(demoId);
  }

  return 'Exemplo interativo do portfólio NEXUS. Escolha uma sugestão abaixo ou pergunte sobre programação, MTR, PDV ou painel.';
}
