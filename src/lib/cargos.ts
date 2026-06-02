import type { HubCargo } from '../types/database';

export const CARGOS: HubCargo[] = [
  'CEO',
  'CTO',
  'Desenvolvedor',
  'Administrador',
  'Operador',
  'Visualizador',
];

export const CARGOS_GESTAO: HubCargo[] = ['CEO', 'CTO', 'Administrador'];

export function podeGerenciar(cargo: HubCargo | undefined): boolean {
  return cargo !== undefined && CARGOS_GESTAO.includes(cargo);
}
