export type HubCargo =
  | 'CEO'
  | 'CTO'
  | 'Desenvolvedor'
  | 'Administrador'
  | 'Operador'
  | 'Visualizador';

export interface HubProfile {
  id: string;
  email: string;
  usuario: string;
  nome: string;
  cargo: HubCargo;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface HubSystem {
  id: string;
  nome: string;
  url: string;
  descricao: string;
  ordem: number;
  ativo: boolean;
}

export interface HubFinanceSubscription {
  id: string;
  nome: string;
  fornecedor: string | null;
  valor_mensal: number;
  moeda: string;
  dia_vencimento: number;
  categoria: string | null;
  ativo: boolean;
  notas: string | null;
}

export interface HubFinanceInvestment {
  id: string;
  titulo: string;
  valor: number;
  tipo: 'investimento' | 'Saída';
  categoria: string | null;
  responsavel: 'Rafael' | 'Vinícius';
  status: string;
  data_investimento: string | null;
  notas: string | null;
  created_at?: string;
}

export type EntradaSecaoDb = 'implantacoes' | 'mensalidades';

export interface HubFinanceReceivable {
  id: string;
  cliente_descricao: string;
  valor: number;
  categoria?: string | null;
  /** Fila na aba Entrada: implantacoes (cima) | mensalidades (baixo) */
  entrada_secao?: EntradaSecaoDb | null;
  data_prevista: string;
  status: 'pendente' | 'recebido' | 'atrasado';
  notas: string | null;
  parcelado?: boolean;
  qtd_parcelas?: number | null;
  parcelas_pagas?: number[];
  created_at?: string;
}

export interface TodoistTask {
  id: string;
  content: string;
  description?: string;
  is_completed: boolean;
  due?: { date?: string; datetime?: string };
  priority: number;
  url: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  htmlLink?: string;
  calendar: 'rafael' | 'vinicius' | 'combinado';
}
