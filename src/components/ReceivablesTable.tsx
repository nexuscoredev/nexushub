import { useState } from 'react';
import type { EntradaSecao, FinanceFluxoSecao } from '../lib/financeCategories';
import { ReceivableMoveButtons } from './ReceivableMoveButtons';
import { formatBRL, formatDate } from '../lib/format';
import {
  parseParcelasFromReceivable,
  persistReceivable,
  stripUserNotas,
  valorPagoReceivable,
  valorRestanteReceivable,
  valorParcela,
  type ParcelasState,
} from '../lib/receivableParcelas';
import { supabase } from '../lib/supabase';
import type { HubFinanceReceivable } from '../types/database';
import styles from '../pages/FinanceiroPage.module.css';
import { deleteFinanceRow } from './FinanceCrudBar';
import { ReceivableFinanceForm } from './ReceivableFinanceForm';

interface ReceivablesTableProps {
  title?: string;
  rows: HubFinanceReceivable[];
  fluxoSecao: FinanceFluxoSecao;
  onRefresh: () => void;
  compact?: boolean;
  /** Sem margem extra — encaixa sob o contrato do cliente */
  embedded?: boolean;
  /** Chips de parcela em linha, só "1ª", "2ª"… */
  compactParcelas?: boolean;
  /** Só botão de adicionar (sem tabela vazia) */
  addOnly?: boolean;
  onMoveToSecao?: (row: HubFinanceReceivable, secao: EntradaSecao) => Promise<void>;
}

export function ReceivablesTable({
  title,
  rows,
  fluxoSecao,
  onRefresh,
  compact,
  embedded,
  compactParcelas,
  addOnly,
  onMoveToSecao,
}: ReceivablesTableProps) {
  const [openAdd, setOpenAdd] = useState(false);
  const [editing, setEditing] = useState<HubFinanceReceivable | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este registro?')) return;
    const err = await deleteFinanceRow('hub_finance_receivables', id);
    if (err) alert(err);
    else onRefresh();
  };

  const saveParcelas = async (row: HubFinanceReceivable, parcelas: ParcelasState) => {
    if (!supabase) return;
    setSavingId(row.id);
    const err = await persistReceivable(
      supabase,
      row.id,
      {
        cliente_descricao: row.cliente_descricao,
        valor: Number(row.valor),
        data_prevista: row.data_prevista,
        notas: stripUserNotas(row.notas) || undefined,
      },
      parcelas,
      fluxoSecao,
    );
    setSavingId(null);
    if (err) alert(err);
    else onRefresh();
  };

  const toggleInlineParcela = (row: HubFinanceReceivable, n: number, checked: boolean) => {
    const p = parseParcelasFromReceivable(row);
    if (!p.parcelado) return;
    const pagas = checked
      ? [...new Set([...p.parcelas_pagas, n])].sort((a, b) => a - b)
      : p.parcelas_pagas.filter((x) => x !== n);
    void saveParcelas(row, { ...p, parcelas_pagas: pagas });
  };

  const toggleAvista = (row: HubFinanceReceivable, pago: boolean) => {
    void saveParcelas(row, {
      parcelado: false,
      qtd_parcelas: 1,
      parcelas_pagas: pago ? [1] : [],
    });
  };

  const enableParcelas = (row: HubFinanceReceivable) => {
    const p = parseParcelasFromReceivable(row);
    void saveParcelas(row, {
      parcelado: true,
      qtd_parcelas: p.parcelado ? p.qtd_parcelas : 5,
      parcelas_pagas: [],
    });
  };

  const wrapClass = [
    'table-wrap',
    embedded ? styles.embeddedTable : '',
    styles.tableReceivables,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={wrapClass}
      style={{
        marginBottom: embedded || compact ? 0 : undefined,
        padding: embedded || compact ? 0 : undefined,
        border: embedded || compact ? 'none' : undefined,
        background: embedded || compact ? 'transparent' : undefined,
      }}
    >
      {title && !embedded && (
        <h3 style={{ fontSize: '0.88rem', marginBottom: '0.65rem', color: 'var(--muted)' }}>{title}</h3>
      )}
      {title && embedded && (
        <p className={styles.recebimentosLabel}>{title}</p>
      )}

      <div style={{ marginBottom: embedded ? '0.5rem' : '1rem' }}>
        <button type="button" className="btn-primary" onClick={() => setOpenAdd(!openAdd)}>
          {openAdd ? 'Cancelar' : addOnly ? 'Adicionar registro' : 'Adicionar registro'}
        </button>
      </div>
      {openAdd && (
        <ReceivableFinanceForm
          fluxoSecao={fluxoSecao}
          onSaved={() => {
            setOpenAdd(false);
            onRefresh();
          }}
          onCancel={() => setOpenAdd(false)}
        />
      )}
      {editing && (
        <ReceivableFinanceForm
          recordId={editing.id}
          initialValues={editing}
          fluxoSecao={fluxoSecao}
          onSaved={() => {
            setEditing(null);
            onRefresh();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {!addOnly && (
      <table className="data-table">
        <thead>
          <tr>
            <th>cliente</th>
            <th>valor total</th>
            <th>pago</th>
            <th>falta</th>
            <th>pagamento</th>
            <th>data</th>
            <th>notas</th>
            <th>mover fila</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const p = parseParcelasFromReceivable(row);
            const pago = valorPagoReceivable(row);
            const falta = valorRestanteReceivable(row);
            const busy = savingId === row.id;
            const pagoClass = falta === 0 ? styles.pagoOk : pago > 0 ? styles.pagoParcial : '';

            const parcelaLabel = compactParcelas
              ? (n: number) => `${n}ª`
              : (n: number) => `${n}ª (${formatBRL(valorParcela(Number(row.valor), p))})`;

            return (
              <tr key={row.id}>
                <td className={styles.cellCliente}>{row.cliente_descricao}</td>
                <td>{formatBRL(Number(row.valor))}</td>
                <td className={pagoClass}>{formatBRL(pago)}</td>
                <td>{formatBRL(falta)}</td>
                <td className={styles.cellPagamento}>
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
                <td>{formatDate(row.data_prevista)}</td>
                <td>{stripUserNotas(row.notas) || '—'}</td>
                <td className={styles.cellMover}>
                  {onMoveToSecao ? (
                    <ReceivableMoveButtons row={row} onMove={onMoveToSecao} />
                  ) : (
                    '—'
                  )}
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
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
      )}
      {!addOnly && rows.length === 0 && (
        <p style={{ color: 'var(--muted)', padding: '0.75rem 0' }}>Nenhum registro nesta fila.</p>
      )}
    </div>
  );
}
