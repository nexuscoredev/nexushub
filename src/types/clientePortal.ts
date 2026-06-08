export type HubClienteProcessoStatus =
  | 'novo'
  | 'em_andamento'
  | 'aguardando_cliente'
  | 'concluido'
  | 'pausado';

export type HubClienteSolicitacaoStatus = 'aberta' | 'em_analise' | 'respondida' | 'fechada';

export interface HubCliente {
  id: string;
  nome: string;
  slug: string | null;
  email_contato: string | null;
  ativo: boolean;
}

export interface HubClienteConta {
  id: string;
  user_id: string;
  cliente_id: string;
  nome: string;
  email: string;
  ativo: boolean;
  cliente?: HubCliente | null;
}

export interface HubClienteProcesso {
  id: string;
  cliente_id: string;
  titulo: string;
  descricao: string | null;
  status: HubClienteProcessoStatus;
  etapa_atual: string | null;
  progresso_pct: number;
  visivel_cliente: boolean;
  updated_at: string;
  created_at: string;
}

export interface HubClienteContrato {
  id: string;
  cliente_id: string;
  titulo: string;
  descricao: string | null;
  arquivo_url: string | null;
  vigencia_inicio: string | null;
  vigencia_fim: string | null;
  visivel_cliente: boolean;
  created_at: string;
}

export interface HubClienteSolicitacao {
  id: string;
  cliente_id: string;
  autor_user_id: string | null;
  titulo: string;
  mensagem: string;
  status: HubClienteSolicitacaoStatus;
  resposta: string | null;
  created_at: string;
  updated_at: string;
}
