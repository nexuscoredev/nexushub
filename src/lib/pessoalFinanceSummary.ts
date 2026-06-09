import type { HubPersonalContaGrupo, HubPersonalTransaction } from '../types/database';
import {
  saldoPessoal,
  totalEntradasPessoal,
  totalSaidasPessoal,
} from './pessoal';
import { totalFixosPessoal, totalVariaveisPessoal } from './personalFinanceVisuals';

export interface PessoalFinanceSummary {
  entradas: number;
  saidas: number;
  saldo: number;
  fixos: number;
  variaveis: number;
  outrasSaidas: number;
  valorPago: number;
  valorAPagar: number;
  percentualPagas: number;
  totalContasChecklist: number;
}

export function buildPessoalFinanceSummary(rows: HubPersonalTransaction[]): PessoalFinanceSummary {
  const entradas = totalEntradasPessoal(rows);
  const saidas = totalSaidasPessoal(rows);
  const fixos = totalFixosPessoal(rows);
  const variaveis = totalVariaveisPessoal(rows);
  const outrasSaidas = rows
    .filter((r) => r.tipo === 'saida' && !r.grupo)
    .reduce((s, r) => s + Number(r.valor), 0);

  const contasChecklist = rows.filter((r) => r.tipo === 'saida' && r.grupo);
  const valorPagoContas = contasChecklist
    .filter((r) => r.pago)
    .reduce((s, r) => s + Number(r.valor), 0);
  const valorAPagar = contasChecklist
    .filter((r) => !r.pago)
    .reduce((s, r) => s + Number(r.valor), 0);
  const valorPago = valorPagoContas + outrasSaidas;

  const totalContasChecklist = contasChecklist.length;
  const pagasCount = contasChecklist.filter((r) => r.pago).length;
  const percentualPagas =
    totalContasChecklist === 0 ? 0 : Math.round((pagasCount / totalContasChecklist) * 100);

  return {
    entradas,
    saidas,
    saldo: saldoPessoal(rows),
    fixos,
    variaveis,
    outrasSaidas,
    valorPago,
    valorAPagar,
    percentualPagas,
    totalContasChecklist,
  };
}

export function sumGrupoRows(
  rows: HubPersonalTransaction[],
  grupo: HubPersonalContaGrupo,
): number {
  return rows
    .filter((r) => r.grupo === grupo)
    .reduce((s, r) => s + Number(r.valor), 0);
}

export function nextOrdemInGrupo(
  rows: HubPersonalTransaction[],
  grupo: HubPersonalContaGrupo,
): number {
  const inGrupo = rows.filter((r) => r.grupo === grupo);
  if (inGrupo.length === 0) return 1;
  return Math.max(...inGrupo.map((r) => r.ordem ?? 0)) + 1;
}
