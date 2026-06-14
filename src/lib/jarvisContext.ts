import { buildPessoalFinanceSummary } from './pessoalFinanceSummary';
import { humorRotulo, loadHumorDoDia } from './pessoalHumor';
import { currentMonthKey } from './personalFinanceMonth';
import type { HubPersonalTransaction } from '../types/database';
import type { JarvisContextSnapshot } from '../types/jarvis';

function mapConta(row: HubPersonalTransaction) {
  return {
    id: row.id,
    descricao: row.descricao,
    valor: Number(row.valor),
    grupo: row.grupo ?? null,
    pago: Boolean(row.pago),
    dia_vencimento: row.dia_vencimento ?? null,
    data_referencia: row.data_referencia,
  };
}

export function buildJarvisContext(
  rows: HubPersonalTransaction[],
  userId: string | undefined,
  userName: string,
  monthKey?: string,
): JarvisContextSnapshot {
  const key = monthKey ?? currentMonthKey();
  const monthRows = rows.filter((r) => r.data_referencia.startsWith(key));
  const summary = buildPessoalFinanceSummary(monthRows.length > 0 ? monthRows : rows);
  const contas = (monthRows.length > 0 ? monthRows : rows).filter((r) => r.tipo === 'saida' && r.grupo);
  const humor = loadHumorDoDia(userId);

  return {
    userName,
    monthKey: key,
    humorHoje: humor,
    humorRotulo: humor == null ? null : humorRotulo(humor),
    summary: {
      entradas: summary.entradas,
      saidas: summary.saidas,
      saldo: summary.saldo,
      valorAPagar: summary.valorAPagar,
      valorPago: summary.valorPago,
      percentualPagas: summary.percentualPagas,
      totalContasChecklist: summary.totalContasChecklist,
    },
    contasPendentes: contas.filter((r) => !r.pago).map(mapConta),
    contasRecentes: contas.slice(0, 12).map(mapConta),
  };
}
