import type { HubClienteMarcoStatus } from '../types/clientePortal';

export interface LigeirinhoJornadaMarco {
  titulo: string;
  descricao: string;
  fase_ordem: number;
  status: HubClienteMarcoStatus;
}

/** Linha do tempo alinhada às 4 fases do contrato — linguagem para o cliente */
export const LIGEIRINHO_JORNADA_MARCOS: LigeirinhoJornadaMarco[] = [
  {
    fase_ordem: 1,
    titulo: 'Fase 1 — Caixa e cadastros da loja',
    descricao:
      'Mapeamos o dia a dia da loja física e organizamos o PDV para vender com agilidade, com produtos e categorias no lugar certo.',
    status: 'concluido',
  },
  {
    fase_ordem: 2,
    titulo: 'Fase 2 — Totem de autoatendimento',
    descricao:
      'Totem na loja com visual da marca Ligeirinho e combos prontos para o cliente escolher no próprio tablet.',
    status: 'concluido',
  },
  {
    fase_ordem: 3,
    titulo: 'Fase 3 — Operação e entregas',
    descricao:
      'Painel da equipe para acompanhar pedidos — do recebimento à preparação, rota e entrega concluída.',
    status: 'em_curso',
  },
  {
    fase_ordem: 4,
    titulo: 'Fase 4 — Validação e lançamento',
    descricao:
      'Testes finais com sua equipe, ajustes de última hora e início da operação assistida no dia a dia.',
    status: 'pendente',
  },
];
