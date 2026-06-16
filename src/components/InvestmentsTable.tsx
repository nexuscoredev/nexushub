import { useState } from 'react';
import type { FinanceFluxoSecao } from '../lib/financeCategories';
import { formatBRL, formatDate } from '../lib/format';
import {
  parseParcelasFromInvestment,
  persistInvestment,
  stripUserNotas,
  valorPagoInvestment,
  valorRestanteInvestment,
  valorParcela,
  type ParcelasState,
} from '../lib/investmentParcelas';
import { supabase } from '../lib/supabase';
import type { HubFinanceInvestment } from '../types/database';
import styles from '../pages/FinanceiroPage.module.css';
import { deleteFinanceRow } from './FinanceCrudBar';
import { InvestmentFinanceForm } from './InvestmentFinanceForm';

interface InvestmentsTableProps {
  title?: string;
  rows: HubFinanceInvestment[];
  fluxoSecao: FinanceFluxoSecao;
  preset?: Record<string, unknown>;
  onRefresh: () => void;
  compact?: boolean;
  compactParcelas?: boolean;
}

export function InvestmentsTable({
  title,
  rows,
  fluxoSecao,
  preset,
  onRefresh,
  compact,
  compactParcelas,
}: InvestmentsTableProps) {
  const [openAdd, setOpenAdd] = useState(false);
  const [editing, setEditing] = useState<HubFinanceInvestment | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este registro?')) return;
    const err = await deleteFinanceRow('hub_finance_investments', id);
    if (err) alert(err);
    else onRefresh();
  };

  const saveParcelas = async (row: HubFinanceInvestment, parcelas: ParcelasState) => {
    if (!supabase) return;
    setSavingId(row.id);
    const err = await persistInvestment(
      supabase,
      row.id,
      {
        titulo: row.titulo,
        valor: Number(row.valor),
        tipo: row.tipo,
        responsavel: row.responsavel,
        data_investimento: row.data_investimento?.slice(0, 10) || undefined,
        notas: stripUserNotas(row.notas) || undefined,
      },
      parcelas,
      fluxoSecao,
    );
    setSavingId(null);
    if (err) alert(err);
    else onRefresh();
  };

  const toggleInlineParcela = (row: HubFinanceInvestment, n: number, checked: boolean) => {
    const p = parseParcelasFromInvestment(row);
    if (!p.parcelado) return;
    const pagas = checked
      ? [...new Set([...p.parcelas_pagas, n])].sort((a, b) => a - b)
      : p.parcelas_pagas.filter((x) => x !== n);
    void saveParcelas(row, { ...p, parcelas_pagas: pagas });
  };

  const toggleAvista = (row: HubFinanceInvestment, pago: boolean) => {
    void saveParcelas(row, {
      parcelado: false,
      qtd_parcelas: 1,
      parcelas_pagas: pago ? [1] : [],
    });
  };

  const enableParcelas = (row: HubFinanceInvestment) => {
    const p = parseParcelasFromInvestment(row);
    void saveParcelas(row, {
      parcelado: true,
      qtd_parcelas: p.parcelado ? p.qtd_parcelas : 5,
      parcelas_pagas: [],
    });
  };

  const wrapClass = [
    'table-wrap',
    styles.tableReceivables,
    styles.financeMobileCards,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={wrapClass}
      style={{
        marginBottom: compact ? 0 : undefined,
        padding: compact ? 0 : undefined,
        border: compact ? 'none' : undefined,
        background: compact ? 'transparent' : undefined,
      }}
    >
      {title && (
        <h3 style={{ fontSize: '0.88rem', marginBottom: '0.65rem', color: 'var(--muted)' }}>{title}</h3>
      )}

      <div className={styles.addRowBar}>
        <button type="button" className="btn-primary" onClick={() => setOpenAdd(!openAdd)}>
          {openAdd ? 'Cancelar' : 'Adicionar registro'}
        </button>
      </div>
      {openAdd && (
        <InvestmentFinanceForm
          preset={preset}
          fluxoSecao={fluxoSecao}
          onSaved={() => {
            setOpenAdd(false);
            onRefresh();
          }}
          onCancel={() => setOpenAdd(false)}
        />
      )}
      {editing && (
        <InvestmentFinanceForm
          recordId={editing.id}
          initialValues={editing}
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
            <th>descrição</th>
            <th>valor total</th>
            <th>pago</th>
            <th>falta</th>
            <th>pagamento</th>
            <th>data</th>
            <th>responsável</th>
            <th>notas</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const p = parseParcelasFromInvestment(row);
            const pago = valorPagoInvestment(row);
            const falta = valorRestanteInvestment(row);
            const busy = savingId === row.id;
            const pagoClass = falta === 0 ? styles.pagoOk : pago > 0 ? styles.pagoParcial : '';

            const parcelaLabel = compactParcelas
              ? (n: number) => `${n}ª`
              : (n: number) => `${n}ª (${formatBRL(valorParcela(Number(row.valor), p))})`;

            return (
              <tr key={row.id}>
                <td data-label="Descrição">{row.titulo}</td>
                <td data-label="Valor total">{formatBRL(Number(row.valor))}</td>
                <td className={pagoClass} data-label="Pago">
                  {formatBRL(pago)}
                </td>
                <td data-label="Falta">{formatBRL(falta)}</td>
                <td className={styles.cellPagamento} data-label="Pagamento">
                  {p.parcelado ? (
                    <div className={styles.parcelasRow}>
                      {compactParcelas && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', width: '100%', marginBottom: '0.15rem' }}>
                          {formatBRL(valorParcela(Number(row.valor), p))}/parcela
                        </span>
                      )}
                      {Array.from({ length: Math.max(1, p.qtd_parcelas) }, (_, i) => i + 1).map((n) => (
                        <label key={n} className={styles.parcelaChip}>
                          <input
                            type="checkbox"
                            disabled={busy}
                            checked={p.parcelas_pagas.includes(n)}
                            onChange={(e) => toggleInlineParcela(row, n, e.target.checked)}
                          />
                          {parcelaLabel(n)}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.parcelasRow}>
                      <label className={styles.parcelaChip}>
                        <input
                          type="checkbox"
                          disabled={busy}
                          checked={p.parcelas_pagas.length > 0}
                          onChange={(e) => toggleAvista(row, e.target.checked)}
                        />
                        À vista
                      </label>
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.45rem' }}
                        disabled={busy}
                        onClick={() => enableParcelas(row)}
                      >
                        Parcelar
                      </button>
                    </div>
                  )}
                </td>
                <td data-label="Data">{formatDate(row.data_investimento ?? '')}</td>
                <td data-label="Responsável">{row.responsavel}</td>
                <td data-label="Notas">{stripUserNotas(row.notas) || '—'}</td>
                <td className={styles.cellActions} data-label="Ações">
                  <button type="button" className="btn-ghost" onClick={() => setEditing(row)}>
                    Editar
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => void handleDelete(row.id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p style={{ color: 'var(--muted)', padding: '0.75rem 0' }}>Nenhum registro nesta fila.</p>
      )}
    </div>
  );
}
