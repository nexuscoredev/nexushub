export type StatusDiarioSecao = {
  id: string;
  titulo: string;
  destaque?: string;
  itens: string[];
};

export type StatusDiarioEntry = {
  dataIso: string;
  dataLabel: string;
  produto: string;
  titulo: string;
  secoes: StatusDiarioSecao[];
  rodape?: string;
};

/** Atualize ao publicar o resumo do dia para o cliente Ligeirinho. */
export const LIGEIRINHO_STATUS_DIARIO: StatusDiarioEntry = {
  dataIso: '2026-06-03',
  dataLabel: '3 de junho de 2026',
  produto: 'Ligeirinho Hub',
  titulo: 'O que melhorou hoje',
  secoes: [
    {
      id: 'apps',
      titulo: 'Organização dos aplicativos',
      destaque: 'O Hub ficou mais intuitivo: cada função está no app certo.',
      itens: [
        'Cadastros (parceiros, filial, formas de pagamento, promoção, usuários) → Ligeirinho Operacional',
        'Relatórios (vendas, fiscal, painel gerencial) → Ligeirinho Financeiro',
        'Produtos → Ligeirinho Operacional',
        'Quem opera o dia a dia abre o Operacional; quem cuida do financeiro abre o Financeiro — sem procurar no painel administrativo.',
      ],
    },
    {
      id: 'clientes',
      titulo: 'Clientes (Operacional)',
      itens: [
        'Lista em tabela, mais fácil de ler com muitos registros',
        'Etiqueta Cayena nos clientes dessa base + filtro para ver só eles',
        'Editar cliente na própria tela, sem ir em outro menu',
        'Contador mostra quantos clientes Cayena existem na base',
      ],
    },
    {
      id: 'parceiros',
      titulo: 'Parceiros e cadastros',
      itens: [
        'Ao cadastrar parceiro, um perfil por vez (cliente, fornecedor, vendedor ou transportadora)',
        'Formulários em janelas centralizadas, mais confortáveis na tela',
        'Possibilidade de excluir parceiro quando não houver pedidos vinculados',
      ],
    },
    {
      id: 'historico',
      titulo: 'Histórico e controle',
      itens: [
        'Nova área Histórico no admin: linha do tempo com frases como “Denise cadastrou o cliente X” ou “Vinícius alterou o produto Y”',
        'Administradores podem desfazer algumas ações recentes quando necessário',
      ],
    },
    {
      id: 'equipe',
      titulo: 'Equipe e permissões',
      itens: [
        'Para usuários Visualizador, a escolha de páginas liberadas ficou organizada por aplicativo, com busca e opção de marcar tudo de um grupo',
      ],
    },
    {
      id: 'onde-ver',
      titulo: 'Onde ver as novidades no sistema',
      itens: [
        'No menu lateral, botão Novidades (ícone de estrela) — a entrada “Apps mais organizados e rotina do dia a dia mais fácil” aparece no topo.',
      ],
    },
  ],
};
