import type {
  HubFinanceInvestment,
  HubFinanceReceivable,
  HubFinanceSubscription,
} from '../types/database';

export function totalMensalAssinaturas(
  items: HubFinanceSubscription[],
): number {
  return items
    .filter((s) => s.ativo)
    .reduce((sum, s) => sum + Number(s.valor_mensal), 0);
}

export function totalRecebido(items: HubFinanceReceivable[]): number {
  return items
    .filter((r) => r.status === 'recebido')
    .reduce((sum, r) => sum + Number(r.valor), 0);
}

export function totalSaidas(items: HubFinanceInvestment[]): number {
  return items
    .filter((i) => i.tipo === 'Saída')
    .reduce((sum, i) => sum + Number(i.valor), 0);
}

export function totalSaidasPorResponsavel(
  items: HubFinanceInvestment[],
): Record<string, number> {
  return items
    .filter((i) => i.tipo === 'Saída')
    .reduce<Record<string, number>>((acc, i) => {
      acc[i.responsavel] = (acc[i.responsavel] ?? 0) + Number(i.valor);
      return acc;
    }, {});
}
