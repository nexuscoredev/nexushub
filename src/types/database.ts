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
  descricao: string;
  valor: number;
  moeda: string;
  tipo: 'investimento' | 'Saída';
  responsavel: 'Rafael' | 'Vinícius';
  status: string;
  data_referencia: string | null;
  notas: string | null;
}

export interface HubFinanceReceivable {
  id: string;
  cliente_descricao: string;
  valor: number;
  moeda: string;
  data_prevista: string;
  status: 'pendente' | 'recebido' | 'atrasado';
  notas: string | null;
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
