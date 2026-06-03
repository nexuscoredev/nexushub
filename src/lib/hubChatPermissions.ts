import type { HubCargo } from '../types/database';

/** Coluna «Solicitações» (fila de pedidos de ajuste) — alinhado ao RG (Desenvolvedor / gestão). */
export function hubChatVeColunaSolicitacoes(cargo: HubCargo | undefined): boolean {
  return cargo === 'Desenvolvedor' || cargo === 'CEO' || cargo === 'CTO';
}

export function hubChatPodeGerirChat(cargo: HubCargo | undefined): boolean {
  return hubChatVeColunaSolicitacoes(cargo);
}
