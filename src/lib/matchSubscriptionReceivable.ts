import type { HubFinanceReceivable } from '../types/database';

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim();
}

/** Associa recebimento ao contrato mensal pelo nome do cliente. */
export function matchesSubscriptionReceivable(
  receivable: HubFinanceReceivable,
  nomeContrato: string,
): boolean {
  const c = norm(receivable.cliente_descricao);
  const n = norm(nomeContrato);
  if (c.includes(n) || n.includes(c)) return true;
  const cRoot = c.split(/[\s(]/)[0] ?? '';
  const nRoot = n.split(/[\s(]/)[0] ?? '';
  return cRoot.length >= 3 && nRoot.length >= 3 && (c.includes(nRoot) || n.includes(cRoot));
}

export function groupReceivablesBySubscription(
  subscriptions: { id: string; nome: string }[],
  receivables: HubFinanceReceivable[],
): {
  groups: { subscriptionId: string; nome: string; receivables: HubFinanceReceivable[] }[];
  outros: HubFinanceReceivable[];
} {
  const used = new Set<string>();
  const groups = subscriptions.map((sub) => {
    const linked = receivables.filter((r) => {
      if (used.has(r.id)) return false;
      if (!matchesSubscriptionReceivable(r, sub.nome)) return false;
      used.add(r.id);
      return true;
    });
    return { subscriptionId: sub.id, nome: sub.nome, receivables: linked };
  });
  const outros = receivables.filter((r) => !used.has(r.id));
  return { groups, outros };
}
