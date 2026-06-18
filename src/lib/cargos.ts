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

export const CARGOS_PESSOAL: HubCargo[] = ['CEO', 'CTO'];

export function podeAcessarPessoal(cargo: HubCargo | undefined): boolean {
  return cargo !== undefined && CARGOS_PESSOAL.includes(cargo);
}

export const CARGOS_JARVIS: HubCargo[] = ['CEO', 'CTO', 'Desenvolvedor'];

export function podeUsarJarvis(cargo: HubCargo | undefined): boolean {
  return cargo !== undefined && CARGOS_JARVIS.includes(cargo);
}

export const CARGOS_DOCUMENTACAO: HubCargo[] = ['CEO', 'CTO'];

export function podeAcessarDocumentacao(cargo: HubCargo | undefined): boolean {
  return cargo !== undefined && CARGOS_DOCUMENTACAO.includes(cargo);
}
