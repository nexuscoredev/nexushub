export type JarvisRole = 'user' | 'assistant';

export interface JarvisMessage {
  id: string;
  role: JarvisRole;
  content: string;
  actionsExecuted?: string[];
}

export interface JarvisContextConta {
  id: string;
  descricao: string;
  valor: number;
  grupo: string | null;
  pago: boolean;
  dia_vencimento: number | null;
  data_referencia: string;
}

export interface JarvisContextSnapshot {
  userName: string;
  monthKey: string;
  humorHoje: number | null;
  humorRotulo: string | null;
  summary: {
    entradas: number;
    saidas: number;
    saldo: number;
    valorAPagar: number;
    valorPago: number;
    percentualPagas: number;
    totalContasChecklist: number;
  };
  contasPendentes: JarvisContextConta[];
  contasRecentes: JarvisContextConta[];
}

export type JarvisAction =
  | { type: 'navigate'; path: string }
  | { type: 'toggle_conta_pago'; transactionId: string; pago: boolean }
  | { type: 'open_url'; url: string };

export interface JarvisChatResponse {
  message: string;
  actions?: JarvisAction[];
  configured?: boolean;
}
