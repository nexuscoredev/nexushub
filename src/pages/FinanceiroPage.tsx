import { useCallback, useEffect, useState } from 'react';
import { deleteFinanceRow, FinanceCrudBar } from '../components/FinanceCrudBar';
import { PageHeader } from '../components/PageHeader';
import {
  totalMensalAssinaturas,
  totalRecebido,
  totalSaidas,
  totalSaidasPorResponsavel,
} from '../lib/financeiro';
import { formatBRL, formatDate } from '../lib/format';
import { supabase, supabaseErrorMessage } from '../lib/supabase';
import type {
  HubFinanceInvestment,
  HubFinanceReceivable,
  HubFinanceSubscription,
} from '../types/database';

type Tab = 'entradas' | 'assinaturas' | 'investimentos' | 'saidas';

export function FinanceiroPage() {
  const [tab, setTab] = useState<Tab>('entradas');
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

  const saidas = investments.filter((x) => x.tipo === 'Saída');
  const investOnly = investments.filter((x) => x.tipo === 'investimento');
  const split = totalSaidasPorResponsavel(investments);

  return (
    <div>
      <PageHeader
        badge="Finance"
        title="Financeiro"
        subtitle="Gestão financeira NEXUS — acesso restrito aos sócios."
      />

      {error && <div className="error-banner" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Assinaturas / mês</div>
          <div className="kpi-value">{formatBRL(totalMensalAssinaturas(subscriptions))}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total recebido</div>
          <div className="kpi-value">{formatBRL(totalRecebido(receivables))}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total saídas</div>
          <div className="kpi-value">{formatBRL(totalSaidas(investments))}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Saídas por sócio</div>
          <div className="kpi-value" style={{ fontSize: '0.85rem' }}>
            Rafael {formatBRL(split.Rafael ?? 0)} · Vinícius {formatBRL(split['Vinícius'] ?? 0)}
          </div>
        </div>
      </div>

      <div className="tabs">
        {(
          [
            ['entradas', 'Entradas'],
            ['assinaturas', 'Assinaturas'],
            ['investimentos', 'Investimentos'],
            ['saidas', 'Saídas'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`tab ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Carregando…</p>
      ) : (
        <>
          {tab === 'entradas' && (
            <FinanceTable
              title="Entradas / a receber"
              table="hub_finance_receivables"
              rows={receivables}
              columns={['cliente_descricao', 'valor', 'data_prevista', 'status', 'notas']}
              onRefresh={load}
            />
          )}
          {tab === 'assinaturas' && (
            <FinanceTable
              title="Assinaturas mensais"
              table="hub_finance_subscriptions"
              rows={subscriptions}
              columns={['nome', 'valor_mensal', 'dia_vencimento', 'categoria', 'ativo']}
              onRefresh={load}
            />
          )}
          {tab === 'investimentos' && (
            <FinanceTable
              title="Investimentos"
              table="hub_finance_investments"
              rows={investOnly}
              columns={['titulo', 'valor', 'responsavel', 'status', 'data_investimento']}
              onRefresh={load}
            />
          )}
          {tab === 'saidas' && (
            <FinanceTable
              title="Saídas"
              table="hub_finance_investments"
              rows={saidas}
              columns={['titulo', 'valor', 'responsavel', 'status', 'data_investimento']}
              onRefresh={load}
            />
          )}
        </>
      )}
    </div>
  );
}

function FinanceTable<T extends { id: string }>({
  title,
  table,
  rows,
  columns,
  onRefresh,
}: {
  title: string;
  table: 'hub_finance_receivables' | 'hub_finance_subscriptions' | 'hub_finance_investments';
  rows: T[];
  columns: string[];
  onRefresh: () => void;
}) {
  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este registro?')) return;
    const err = await deleteFinanceRow(table, id);
    if (err) alert(err);
    else onRefresh();
  };

  return (
    <div className="card table-wrap">
      <h2 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>{title}</h2>
      <FinanceCrudBar table={table} onSaved={onRefresh} />
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
                else if (typeof val === 'boolean') display = val ? 'Sim' : 'Não';
                else display = String(val ?? '—');
                return <td key={col}>{display}</td>;
              })}
              <td>
                <button type="button" className="btn-ghost" onClick={() => void handleDelete(row.id)}>
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p style={{ color: 'var(--muted)', padding: '1rem 0' }}>Nenhum registro.</p>
      )}
    </div>
  );
}