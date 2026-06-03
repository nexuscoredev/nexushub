import type { HubProfile } from './database';

export type HubChatSystemId = 'nexus-hub' | 'rh-ambiental' | 'ligeirinho';

export type HubChatUsuarioLista = Pick<HubProfile, 'id' | 'nome' | 'cargo' | 'email'>;

export interface HubChatConversaLista {
  id: string;
  participant_low: string;
  participant_high: string;
  ultima_preview: string | null;
  ultima_em: string | null;
  ultima_remetente_id: string | null;
  last_read_at: string | null;
  outro_id: string;
  outro?: HubChatUsuarioLista | null;
  unread: number;
}

export interface HubChatMensagem {
  id: string;
  conversa_id: string;
  remetente_id: string;
  conteudo: string | null;
  anexo_bucket: string | null;
  anexo_path: string | null;
  anexo_nome: string | null;
  anexo_mime: string | null;
  anexo_size: number | null;
  created_at: string;
}

export interface HubChatSolicitacaoFilaItem {
  mensagem_id: string;
  conversa_id: string;
  remetente_id: string;
  solicitante_nome: string;
  preview: string;
  created_at: string;
}
