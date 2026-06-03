import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { FinanceKpiStrip } from '../components/FinanceKpiStrip';
import { MensalidadesEntradaView } from '../components/MensalidadesEntradaView';
import { ReceivablesTable } from '../components/ReceivablesTable';
import {
  deleteFinanceRow,
  FinanceCrudBar,
  FinanceRecordForm,
  type FinanceTable,
} from '../components/FinanceCrudBar';
import { PageHeader } from '../components/PageHeader';
import {
  ENTRADA_SECOES,
  SAIDA_SECOES,
  secaoEntradaReceivable,
  secaoSaidaInvestment,
  type EntradaSecao,
  type FinanceFluxo,
  type FinanceFluxoSecao,
  type SaidaSecao,
} from '../lib/financeCategories';
import {
  totalAReceber,
  totalGeralEntradas,
  totalMensalAssinaturas,
  totalMensalidade,
  totalRecebido,
  totalSaidas,
} from '../lib/financeiro';
import { formatBRL, formatDate } from '../lib/format';
import { valorPagoReceivable } from '../lib/receivableParcelas';
import { supabase, supabaseErrorMessage } from '../lib/supabase';
import type {
  HubFinanceInvestment,
  HubFinanceReceivable,
  HubFinanceSubscription,
} from '../types/database';
import styles from './FinanceiroPage.module.css';

const CATEGORIA_LABELS: Record<string, string> = {
  implantacao: 'Implantação',
  mensalidade: 'Mensalidade',
  assinatura: 'Assinatura',
  transporte: 'Transporte',
  outras: 'Outras',
};

export function FinanceiroPage() {
  const [fluxo, setFluxo] = useState<FinanceFluxo>('entrada');
  const [receivables, setReceivables] = useState<HubFinanceReceivable[]>([]);
  const [subscriptions, setSubscriptions] = useState<HubFinanceSubscription[]>([]);
  const [investments, setInvestments] = useState<HubFinanceInvestment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const [r, s, i] = await Promise.all([
      supabase.from('hub_finance_receivables').select('*').order('data_prevista', { ascending: false }),
      supabase.from('hub_finance_subscriptions').select('*').order('nome'),
      supabase.from('hub_finance_investments').select('*').order('data_investimento', { ascending: false }),
    ]);
    if (r.error || s.error || i.error) {
      setError(supabaseErrorMessage(r.error ?? s.error ?? i.error));
    } else {
      setReceivables((r.data ?? []) as HubFinanceReceivable[]);
      setSubscriptions((s.data ?? []) as HubFinanceSubscription[]);
      setInvestments((i.data ?? []) as HubFinanceInvestment[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const receivablesBySecao = useMemo(() => {
    const map: Record<EntradaSecao, HubFinanceReceivable[]> = {
      implantacoes: [],
      mensalidades: [],
    };
    for (const r of receivables) {
      map[secaoEntradaReceivable(r)].push(r);
    }
    return map;
  }, [receivables]);

  const investmentsBySecao = useMemo(() => {
    const map: Record<SaidaSecao, HubFinanceInvestment[]> = {
      assinaturas: [],
      transporte: [],
      outras: [],
    };
    for (const i of investments) {
      if (i.tipo !== 'Saída' && i.tipo !== 'investimento') continue;
      map[secaoSaidaInvestment(i)].push(i);
    }
    return map;
  }, [investments]);

  const totalMensalidadesRecorrentes = totalMensalAssinaturas(subscriptions);
  const kpiMensalidade = totalMensalidade(subscriptions, receivables);
  const kpiAReceber = totalAReceber(receivables);
  const kpiGeralEntradas = totalGeralEntradas(receivables);
  const kpiRecebido = totalRecebido(receivables);
  const kpiSaidas = totalSaidas(investments);

  return (
    <div className={styles.financePage}>
      <PageHeader
        badge="Finance"
        title="Financeiro"
        subtitle="Implantações em cima · Mensalidades embaixo."
      />

      {error && <div className="error-banner" style={{ marginBottom: '1rem' }}>{error}</div>}
      <FinanceKpiStrip
        values={{
          aReceber: kpiAReceber,
          geralEntradas: kpiGeralEntradas,
          recebido: kpiRecebido,
          mensalidade: kpiMensalidade,
          saidas: kpiSaidas,
        }}
      />

      <div className="tabs">
        {(
          [
            ['entrada', 'Entrada'],
            ['saida', 'Saída'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`tab ${fluxo === id ? 'active' : ''}`}
            onClick={() => setFluxo(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Carregando…</p>
      ) : fluxo === 'entrada' ? (
        <div className={styles.sections}>
          {ENTRADA_SECOES.map((secao) => (
            <FinanceQueueSection
              key={secao.id}
              title={secao.label}
              subtitle={
                secao.id === 'implantacoes'
                  ? 'Projetos de implantação (sistema, app, setup)'
                  : 'Mensalidades e recebimentos recorrentes'
              }
              totalLabel={formatReceivableSectionMeta(
                receivablesBySecao[secao.id],
                secao.id === 'mensalidades' ? totalMensalidadesRecorrentes : 0,
              )}
            >
              {secao.id === 'mensalidades' ? (
                <MensalidadesEntradaView
                  subscriptions={subscriptions}
                  receivables={receivablesBySecao.mensalidades}
                  fluxoSecao={{ fluxo: 'entrada', secao: 'mensalidades' }}
                  onRefresh={load}
                />
              ) : (
                <ReceivablesTable
                  rows={receivablesBySecao[secao.id]}
                  fluxoSecao={{ fluxo: 'entrada', secao: secao.id }}
                  onRefresh={load}
                  compactParcelas
                />
              )}
            </FinanceQueueSection>
          ))}
        </div>
      ) : (
        <div className={styles.sections}>
          {SAIDA_SECOES.map((secao) => (
            <FinanceQueueSection
              key={secao.id}
              title={secao.label}
              totalLabel={formatBRL(sumInvestments(investmentsBySecao[secao.id]))}
            >
              <FinanceTable
                table="hub_finance_investments"
                rows={investmentsBySecao[secao.id]}
                columns={['titulo', 'valor', 'responsavel', 'status', 'data_investimento']}
                preset={{ tipo: 'Saída' }}
                fluxoSecao={{ fluxo: 'saida', secao: secao.id }}
                onRefresh={load}
                hideTitle
              />
            </FinanceQueueSection>
          ))}
        </div>
      )}
    </div>
  );
}

function sumReceivables(items: HubFinanceReceivable[]): number {
  return items.reduce((s, r) => s + Number(r.valor), 0);
}

function sumReceivablesPago(items: HubFinanceReceivable[]): number {
  return items.reduce((s, r) => s + valorPagoReceivable(r), 0);
}

function formatReceivableSectionMeta(
  items: HubFinanceReceivable[],
  contratosMensais = 0,
): string {
  const total = sumReceivables(items);
  const pago = sumReceivablesPago(items);
  const falta = Math.max(0, total - pago);
  let line = `${formatBRL(total)} total · ${formatBRL(pago)} pago · ${formatBRL(falta)} falta`;
  if (contratosMensais > 0) {
    line += ` · ${formatBRL(contratosMensais)}/mês contratos`;
  }
  return line;
}

function sumInvestments(items: HubFinanceInvestment[]): number {
  return items.reduce((s, i) => s + Number(i.valor), 0);
}

function FinanceQueueSection({
  title,
  subtitle,
  totalLabel,
  children,
}: {
  title: string;
  subtitle?: string;
  totalLabel: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>{title}</h2>
          {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
        </div>
        <span className={styles.sectionMeta}>{totalLabel}</span>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function FinanceTable<T extends { id: string }>({
  title,
  table,
  rows,
  columns,
  preset,
  fluxoSecao,
  onRefresh,
  compact,
  hideTitle,
}: {
  title?: string;
  table: FinanceTable;
  rows: T[];
  columns: string[];
  preset?: Record<string, unknown>;
  fluxoSecao?: FinanceFluxoSecao;
  onRefresh: () => void;
  compact?: boolean;
  hideTitle?: boolean;
}) {
  const [editing, setEditing] = useState<T | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este registro?')) return;
    const err = await deleteFinanceRow(table, id);
    if (err) alert(err);
    else onRefresh();
  };

  return (
    <div
      className={`table-wrap ${styles.financeMobileCards}`}
      style={{
        marginBottom: compact ? '1rem' : 0,
        padding: compact ? '0' : undefined,
        border: compact ? 'none' : undefined,
        background: compact ? 'transparent' : undefined,
      }}
    >
      {title && !hideTitle && (
        <h3 style={{ fontSize: '0.88rem', marginBottom: '0.65rem', color: 'var(--muted)' }}>{title}</h3>
      )}
      <FinanceCrudBar
        table={table}
        onSaved={onRefresh}
        preset={preset}
        fluxoSecao={fluxoSecao}
      />
      {editing && (
        <FinanceRecordForm
          table={table}
          recordId={editing.id}
          initialValues={editing as Record<string, unknown>}
          preset={preset}
          fluxoSecao={fluxoSecao}
          onSaved={() => {
            setEditing(null);
            onRefresh();
          }}
          onCancel={() => setEditing(null)}
        />
      )}
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c.replace(/_/g, ' ')}</th>
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((col) => {
                const val = (row as Record<string, unknown>)[col];
                let display: string;
                if (col === 'valor' || col === 'valor_mensal') display = formatBRL(Number(val));
                else if (col.includes('data')) display = formatDate(String(val ?? ''));
                else if (col === 'categoria') display = CATEGORIA_LABELS[String(val)] ?? String(val ?? '—');
                else if (col === 'notas') display = String(val ?? '—');
                else if (typeof val === 'boolean') display = val ? 'Sim' : 'Não';
                else display = String(val ?? '—');
                const label = col.replace(/_/g, ' ');
                return (
                  <td key={col} data-label={label}>
                    {display}
                  </td>
                );
              })}
              <td className={styles.cellActions} data-label="Ações">
                <button type="button" className="btn-ghost" onClick={() => setEditing(row)}>
                  Editar
                </button>
                <button type="button" className="btn-ghost" onClick={() => void handleDelete(row.id)}>
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p style={{ color: 'var(--muted)', padding: '0.75rem 0' }}>Nenhum registro nesta fila.</p>
      )}
    </div>
  );
}
