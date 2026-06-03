import { formatBRL } from '../lib/format';
import { groupReceivablesBySubscription } from '../lib/matchSubscriptionReceivable';
import type { EntradaSecao, FinanceFluxoSecao } from '../lib/financeCategories';
import type { HubFinanceReceivable, HubFinanceSubscription } from '../types/database';
import styles from '../pages/FinanceiroPage.module.css';
import { ReceivablesTable } from './ReceivablesTable';

interface MensalidadesEntradaViewProps {
  subscriptions: HubFinanceSubscription[];
  receivables: HubFinanceReceivable[];
  fluxoSecao: FinanceFluxoSecao;
  onRefresh: () => void;
  onMoveToSecao?: (row: HubFinanceReceivable, secao: EntradaSecao) => Promise<void>;
}

export function MensalidadesEntradaView({
  subscriptions,
  receivables,
  fluxoSecao,
  onRefresh,
  onMoveToSecao,
}: MensalidadesEntradaViewProps) {
  const { groups, outros } = groupReceivablesBySubscription(subscriptions, receivables);

  return (
    <div className={styles.mensalidadesStack}>
      {groups.map((g) => {
        const sub = subscriptions.find((s) => s.id === g.subscriptionId);
        return (
          <div key={g.subscriptionId} className={styles.clientBlock}>
            <div className={styles.clientContractRow}>
              <span className={styles.clientContractName}>{g.nome}</span>
              <span>{formatBRL(Number(sub?.valor_mensal ?? 0))}/mês</span>
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                venc. dia {sub?.dia_vencimento ?? '—'}
              </span>
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                {sub?.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            {g.receivables.length > 0 ? (
              <div className={styles.clientRecebimentos}>
                <p className={styles.recebimentosLabel}>Recebimentos</p>
                <ReceivablesTable
                  rows={g.receivables}
                  fluxoSecao={fluxoSecao}
                  onRefresh={onRefresh}
                  embedded
                  compactParcelas
                  onMoveToSecao={onMoveToSecao}
                />
              </div>
            ) : null}
          </div>
        );
      })}

      {outros.length > 0 && (
        <div className={styles.clientBlock}>
          <p className={styles.recebimentosLabel}>Recebimentos — outros</p>
          <ReceivablesTable
            rows={outros}
            fluxoSecao={fluxoSecao}
            onRefresh={onRefresh}
            embedded
            compactParcelas
            onMoveToSecao={onMoveToSecao}
          />
        </div>
      )}

      <ReceivablesTable
        title="Adicionar recebimento"
        rows={[]}
        fluxoSecao={fluxoSecao}
        onRefresh={onRefresh}
        addOnly
      />
    </div>
  );
}
