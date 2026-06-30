export type DemoId = 'coleta' | 'ligeirinho';

/** Operador fictício exibido no topo da demonstração */
export const DEMO_TEXTO = 'Marina Costa';

export const DEMO_BANNER = 'Portfólio NEXUS · demonstração com dados fictícios';

export interface DemoNavItem {
  id: string;
  label: string;
  icon: string;
}

export interface DemoDefinition {
  id: DemoId;
  brandName: string;
  tagline: string;
  accent: string;
  accentSoft: string;
  nav: DemoNavItem[];
}

export const DEMO_CATALOG: Record<DemoId, DemoDefinition> = {
  coleta: {
    id: 'coleta',
    brandName: 'Coleta de resíduos',
    tagline: 'Programação · MTR · Clientes · Painel',
    accent: '#22c55e',
    accentSoft: 'rgba(34, 197, 94, 0.15)',
    nav: [
      { id: 'inicio', label: 'Início', icon: 'home' },
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
      { id: 'programacao', label: 'Programação', icon: 'calendar_month' },
      { id: 'mtr', label: 'MTR', icon: 'description' },
      { id: 'clientes', label: 'Clientes', icon: 'groups' },
    ],
  },
  ligeirinho: {
    id: 'ligeirinho',
    brandName: 'Sistema de bebidas',
    tagline: 'PDV · Pedidos · Estoque · Painel',
    accent: '#fbbf24',
    accentSoft: 'rgba(251, 191, 36, 0.16)',
    nav: [
      { id: 'inicio', label: 'Início', icon: 'home' },
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
      { id: 'pdv', label: 'PDV', icon: 'point_of_sale' },
      { id: 'pedidos', label: 'Pedidos', icon: 'inventory_2' },
      { id: 'estoque', label: 'Estoque', icon: 'warehouse' },
    ],
  },
};

export function isDemoId(value: string | undefined): value is DemoId {
  return value === 'coleta' || value === 'ligeirinho';
}

export function resolveDemoId(value: string | undefined): DemoId | null {
  if (value === 'adega' || value === 'varejo') return 'ligeirinho';
  return isDemoId(value) ? value : null;
}

export const COLETA_KPIS = [
  { label: 'Coletas hoje', value: '12', delta: '+3 vs ontem' },
  { label: 'MTR em aberto', value: '5', delta: '2 aguardando assinatura' },
  { label: 'Volume estimado', value: '4,8 t', delta: 'Meta do dia' },
  { label: 'Rotas ativas', value: '4', delta: '2 em andamento' },
];

export const COLETA_INICIO_QUICK_STATS = [
  { icon: 'route', label: 'Rotas hoje', value: '4' },
  { icon: 'local_shipping', label: 'Veículos ativos', value: '3' },
  { icon: 'scale', label: 'Volume previsto', value: '4,8 t' },
  { icon: 'description', label: 'MTR pendentes', value: '5' },
];

export const ADEGA_INICIO_QUICK_STATS = [
  { icon: 'receipt_long', label: 'Pedidos hoje', value: '47' },
  { icon: 'point_of_sale', label: 'PDV aberto', value: 'Sim' },
  { icon: 'inventory_2', label: 'Na fila', value: '6' },
  { icon: 'warning', label: 'Alertas estoque', value: '3' },
];

export const COLETA_PIPELINE = [
  { label: 'Programação', icon: 'calendar_month' },
  { label: 'MTR', icon: 'description' },
  { label: 'Pesagem', icon: 'scale' },
  { label: 'Faturamento', icon: 'payments' },
];

export const COLETA_PROGRAMACAO = [
  {
    id: '1',
    hora: '06:30',
    cliente: 'Metalúrgica Horizonte',
    rota: 'Rota A — Industrial',
    caminhao: 'Compactador 01',
    status: 'Em rota',
  },
  {
    id: '2',
    hora: '07:15',
    cliente: 'Clínica Vida Sul',
    rota: 'Rota B — Hospitalar',
    caminhao: 'Baú 02',
    status: 'Em rota',
  },
  {
    id: '3',
    hora: '08:00',
    cliente: 'Lab Química Centro',
    rota: 'Rota C — Laboratorial',
    caminhao: 'Van 03',
    status: 'Agendada',
  },
  {
    id: '4',
    hora: '08:45',
    cliente: 'Supermercado Modelo',
    rota: 'Rota D — Comercial',
    caminhao: 'Compactador 04',
    status: 'Agendada',
  },
  {
    id: '5',
    hora: '09:30',
    cliente: 'Indústria Alimentos Norte',
    rota: 'Rota A — Industrial',
    caminhao: 'Baú 05',
    status: 'Agendada',
  },
  {
    id: '6',
    hora: '10:15',
    cliente: 'Hospital Regional Exemplo',
    rota: 'Rota B — Hospitalar',
    caminhao: 'Van 06',
    status: 'Agendada',
  },
  {
    id: '7',
    hora: '11:00',
    cliente: 'Farmácia Central Fictícia',
    rota: 'Rota D — Comercial',
    caminhao: 'Van 03',
    status: 'Concluída',
  },
  {
    id: '8',
    hora: '13:30',
    cliente: 'Gráfica União Modelo',
    rota: 'Rota E — Mista',
    caminhao: 'Compactador 01',
    status: 'Concluída',
  },
  {
    id: '9',
    hora: '14:45',
    cliente: 'Clínica Odonto Exemplo',
    rota: 'Rota B — Hospitalar',
    caminhao: 'Baú 02',
    status: 'Concluída',
  },
  {
    id: '10',
    hora: '16:00',
    cliente: 'Depósito Construção Sul',
    rota: 'Rota E — Mista',
    caminhao: 'Compactador 04',
    status: 'Agendada',
  },
];

export const COLETA_MTRS = [
  {
    id: '1',
    documento: 'MTR-24061',
    cliente: 'Metalúrgica Horizonte',
    etapa: 'Coleta em andamento',
    status: 'Em andamento',
  },
  {
    id: '2',
    documento: 'MTR-24062',
    cliente: 'Clínica Vida Sul',
    etapa: 'Aguardando assinatura',
    status: 'Emitido',
  },
  {
    id: '3',
    documento: 'MTR-24058',
    cliente: 'Lab Química Centro',
    etapa: 'Pesagem concluída',
    status: 'Finalizado',
  },
  {
    id: '4',
    documento: 'MTR-24063',
    cliente: 'Supermercado Modelo',
    etapa: 'Rascunho — revisão interna',
    status: 'Rascunho',
  },
  {
    id: '5',
    documento: 'MTR-24059',
    cliente: 'Indústria Alimentos Norte',
    etapa: 'Transporte registrado',
    status: 'Finalizado',
  },
  {
    id: '6',
    documento: 'MTR-24064',
    cliente: 'Hospital Regional Sul',
    etapa: 'Emissão pendente',
    status: 'Emitido',
  },
  {
    id: '7',
    documento: 'MTR-24065',
    cliente: 'Farmácia Central',
    etapa: 'Coleta agendada',
    status: 'Em andamento',
  },
  {
    id: '8',
    documento: 'MTR-24066',
    cliente: 'Gráfica União',
    etapa: 'Documento em elaboração',
    status: 'Rascunho',
  },
];

export const COLETA_CLIENTES = [
  {
    id: '1',
    segmento: 'Industrial',
    icon: 'factory',
    regiao: 'Zona Industrial Sul',
    periodicidade: 'Coleta semanal',
    perfil: 'Sólido classe II',
  },
  {
    id: '2',
    segmento: 'Hospitalar',
    icon: 'local_hospital',
    regiao: 'Centro e Zona Sul',
    periodicidade: '2x por semana',
    perfil: 'Infectante grupo A',
  },
  {
    id: '3',
    segmento: 'Laboratorial',
    icon: 'science',
    regiao: 'Região metropolitana',
    periodicidade: 'Quinzenal',
    perfil: 'Químico / reagentes',
  },
  {
    id: '4',
    segmento: 'Comercial',
    icon: 'store',
    regiao: 'Bairros centrais',
    periodicidade: 'Mensal',
    perfil: 'Reciclável misto',
  },
];

export const ADEGA_PIPELINE = [
  { label: 'PDV', icon: 'point_of_sale' },
  { label: 'Pedidos', icon: 'receipt_long' },
  { label: 'Estoque', icon: 'warehouse' },
  { label: 'Painel', icon: 'dashboard' },
];

export const ADEGA_KPIS = [
  { label: 'Pedidos hoje', value: '47', delta: '+12% vs ontem' },
  { label: 'Ticket médio', value: 'R$ 68,50', delta: 'Últimas 24h' },
  { label: 'Estoque baixo', value: '3', delta: 'Itens abaixo do mínimo' },
  { label: 'Canais ativos', value: '3', delta: 'PDV, totem e delivery' },
];

export const ADEGA_CANAIS = [
  { label: 'PDV balcão', icon: 'point_of_sale' },
  { label: 'Totem', icon: 'tablet_mac' },
  { label: 'Delivery', icon: 'delivery_dining' },
];

export const ADEGA_PRODUTOS = [
  { id: 'p1', nome: 'Cerveja Lager 350ml', preco: 8.9, icon: 'sports_bar', categoria: 'Cervejas' },
  { id: 'p2', nome: 'IPA Artesanal 473ml', preco: 14.5, icon: 'local_bar', categoria: 'Cervejas' },
  { id: 'p3', nome: 'Vinho Tinto Suave', preco: 32.0, icon: 'wine_bar', categoria: 'Vinhos' },
  { id: 'p4', nome: 'Gin Premium 750ml', preco: 89.9, icon: 'liquor', categoria: 'Destilados' },
  { id: 'p5', nome: 'Água com Gás 510ml', preco: 4.5, icon: 'water_drop', categoria: 'Sem álcool' },
  { id: 'p6', nome: 'Combo Churrasco', preco: 54.9, icon: 'lunch_dining', categoria: 'Combos' },
  { id: 'p7', nome: 'Refrigerante 2L', preco: 9.9, icon: 'local_cafe', categoria: 'Sem álcool' },
  { id: 'p8', nome: 'Whisky 1L', preco: 119.0, icon: 'liquor', categoria: 'Destilados' },
];

export const ADEGA_PEDIDOS = [
  {
    id: '1',
    pedido: '#D-1042',
    canal: 'Totem',
    cliente: 'Mesa 4',
    total: 'R$ 54,80',
    status: 'Separando',
    hora: '11:24',
  },
  {
    id: '2',
    pedido: '#D-1041',
    canal: 'Delivery',
    cliente: 'Ana M.',
    total: 'R$ 89,50',
    status: 'Na fila',
    hora: '11:18',
  },
  {
    id: '3',
    pedido: '#D-1040',
    canal: 'PDV',
    cliente: 'Balcão',
    total: 'R$ 32,00',
    status: 'Pronto',
    hora: '11:05',
  },
  {
    id: '4',
    pedido: '#D-1039',
    canal: 'App',
    cliente: 'Carlos R.',
    total: 'R$ 124,80',
    status: 'Entregue',
    hora: '10:42',
  },
  {
    id: '5',
    pedido: '#D-1038',
    canal: 'Totem',
    cliente: 'Mesa 1',
    total: 'R$ 41,20',
    status: 'Na fila',
    hora: '10:30',
  },
  {
    id: '6',
    pedido: '#D-1037',
    canal: 'PDV',
    cliente: 'Balcão',
    total: 'R$ 18,90',
    status: 'Separando',
    hora: '10:15',
  },
];

export const ADEGA_ESTOQUE = [
  {
    id: '1',
    sku: 'BEV-001',
    produto: 'Cerveja Lager 350ml',
    saldo: '48 un.',
    minimo: '24 un.',
    status: 'OK',
    pct: 78,
  },
  {
    id: '2',
    sku: 'BEV-014',
    produto: 'IPA Artesanal 473ml',
    saldo: '22 un.',
    minimo: '18 un.',
    status: 'OK',
    pct: 55,
  },
  {
    id: '3',
    sku: 'BEV-032',
    produto: 'Gin Premium 750ml',
    saldo: '6 un.',
    minimo: '12 un.',
    status: 'Baixo',
    pct: 22,
  },
  {
    id: '4',
    sku: 'BEV-008',
    produto: 'Vinho Tinto Suave',
    saldo: '31 un.',
    minimo: '15 un.',
    status: 'OK',
    pct: 64,
  },
  {
    id: '5',
    sku: 'BEV-021',
    produto: 'Refrigerante 2L',
    saldo: '9 un.',
    minimo: '20 un.',
    status: 'Baixo',
    pct: 28,
  },
  {
    id: '6',
    sku: 'BEV-045',
    produto: 'Combo Churrasco',
    saldo: '14 un.',
    minimo: '10 un.',
    status: 'OK',
    pct: 70,
  },
];

export const DASHBOARD_BARS_COLETA = [
  { label: 'Seg', value: 24 },
  { label: 'Ter', value: 48 },
  { label: 'Qua', value: 36 },
  { label: 'Qui', value: 72 },
  { label: 'Sex', value: 88 },
  { label: 'Sáb', value: 62 },
  { label: 'Dom', value: 18 },
];

export const COLETA_DASHBOARD_LINE = [
  { label: 'Jan', value: 38 },
  { label: 'Fev', value: 44 },
  { label: 'Mar', value: 51 },
  { label: 'Abr', value: 58 },
  { label: 'Mai', value: 66 },
  { label: 'Jun', value: 74 },
];

export const DASHBOARD_BARS_ADEGA = [
  { label: 'Seg', value: 35 },
  { label: 'Ter', value: 52 },
  { label: 'Qua', value: 48 },
  { label: 'Qui', value: 72 },
  { label: 'Sex', value: 88 },
  { label: 'Sáb', value: 95 },
  { label: 'Dom', value: 60 },
];

export const COLETA_DASHBOARD_PERFIL = [
  { label: 'Industrial', pct: 38 },
  { label: 'Hospitalar', pct: 27 },
  { label: 'Laboratorial', pct: 15 },
  { label: 'Comercial', pct: 20 },
];

export const COLETA_DASHBOARD_FROTA = [
  { veiculo: 'Compactador 01', status: 'Em rota', detalhe: 'Rota A — Industrial' },
  { veiculo: 'Baú 02', status: 'Em coleta', detalhe: 'Rota B — Hospitalar' },
  { veiculo: 'Van 03', status: 'Disponível', detalhe: 'Aguardando programação' },
  { veiculo: 'Compactador 04', status: 'Manutenção', detalhe: 'Retorno previsto 14h' },
];

export const COLETA_DASHBOARD_EVENTOS = [
  { hora: '06:42', texto: 'MTR emitido · Lab Química Centro' },
  { hora: '07:10', texto: 'Coleta iniciada · Rota B — Hospitalar' },
  { hora: '07:55', texto: 'Pesagem registrada · 1,2 t' },
  { hora: '08:20', texto: 'Supermercado Modelo adicionado à fila' },
  { hora: '09:05', texto: 'Rota A concluída parcialmente · 3 de 5 paradas' },
];

export const ADEGA_DASHBOARD_CANAIS = [
  { label: 'PDV balcão', pct: 42 },
  { label: 'Totem', pct: 28 },
  { label: 'Delivery', pct: 30 },
];

export const ADEGA_DASHBOARD_DESTAQUES = [
  { produto: 'Cerveja Lager 350ml', vendas: '18 un.', tendencia: 'Alta' },
  { produto: 'IPA Artesanal 473ml', vendas: '14 un.', tendencia: 'Estável' },
  { produto: 'Combo Churrasco', vendas: '11 un.', tendencia: 'Alta' },
  { produto: 'Gin Premium 750ml', vendas: '9 un.', tendencia: 'Baixa' },
];

export const ADEGA_DASHBOARD_EVENTOS = [
  { hora: '08:15', texto: 'Pedido #D-1042 · Totem · Mesa 4' },
  { hora: '09:02', texto: 'Estoque baixo · Gin Premium 750ml' },
  { hora: '10:30', texto: 'Venda PDV · R$ 124,80' },
  { hora: '11:18', texto: 'Pedido delivery · Ana M. · Bairro Centro' },
  { hora: '12:05', texto: 'Reposição registrada · 24 un. Cerveja Lager' },
];

/** @deprecated use DASHBOARD_BARS_COLETA or DASHBOARD_BARS_ADEGA */
export const DASHBOARD_BARS = [40, 65, 45, 80, 55, 70, 50];
