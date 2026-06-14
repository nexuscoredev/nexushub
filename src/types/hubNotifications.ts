import type { HubProfile } from './database';

export interface HubNotification {
  id: string;
  recipient_user_id: string | null;
  sender_user_id: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export type HubNotificationSender = Pick<HubProfile, 'id' | 'nome' | 'cargo'>;

export interface HubNotificationLista extends HubNotification {
  sender?: HubNotificationSender | null;
}

export type HubNotificationDestino = 'todos' | 'usuario';
