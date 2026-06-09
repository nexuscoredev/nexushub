import { useMemo, useState, type CSSProperties } from 'react';
import { formatBRL } from '../lib/format';
import {
  GRUPO_VISUAL,
  itemIcon,
  providerVisual,
} from '../lib/personalFinanceVisuals';
import type { PessoalFinanceSummary } from '../lib/pessoalFinanceSummary';
import {
  PESSOAL_CONTA_GRUPOS,
  VINICIUS_VR_MENSAL,
} from '../lib/viniciusPersonalFinance';
import type { HubPersonalContaGrupo, HubPersonalTransaction } from '../types/database';
import {
  deletePersonalConta,
  PersonalContaFixaForm,
  togglePersonalContaPago,
} from './personal/PersonalContaFixaForm';
import styles from './PersonalContasFixasView.module.css';

function sumGrupo(rows: HubPersonalTransaction[]): number {
  return rows.reduce((sum, row) => sum + Number(row.valor), 0);
}

function sumGrupoPago(rows: HubPersonalTransaction[]): number {
  return rows.filter((r) => r.pago).reduce((sum, row) => sum + Number(row.valor), 0);
}

function paidCount(items: HubPersonalTransaction[]): number {
  return items.filter((i) => i.pago).length;
}

interface PersonalContasFixasViewProps {
  rows: HubPersonalTransaction[];
  summary: PessoalFinanceSummary;
  onUpsert: (row: HubPersonalTransaction) => void;
  onRemove: (id: string) => void;
  onPatch: (id: string, patch: Partial<HubPersonalTransaction>) => void;
  onSyncError: () => void;
}

export function PersonalContasFixasView({
  rows,
  summary,
  onUpsert,
  onRemove,
  onPatch,
  onSyncError,
}: PersonalContasFixasViewProps) {
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [addingGrupo, setAddingGrupo] = useState<HubPersonalContaGrupo | null>(null);
  const [editing, setEditing] = useState<HubPersonalTransaction | null>(null);

  const contasRows = useMemo(
    () => rows.filter((row) => row.tipo === 'saida' && row.grupo),
    [rows],
  );

  const byGrupo = useMemo(() => {
    const map: Record<HubPersonalContaGrupo, HubPersonalTransaction[]> = {
      residencial: [],
      carro: [],
      gastos_fixos: [],
      variaveis: [],
    };
    for (const row of contasRows) {
      if (row.grupo) map[row.grupo].push(row);
    }
    for (const grupo of Object.keys(map) as HubPersonalContaGrupo[]) {
      map[grupo].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
    }
    return map;
  }, [contasRows]);

  const togglePago = async (row: HubPersonalTransaction) => {
    const next = !row.pago;
    onPatch(row.id, { pago: next });
    setSavingId(row.id);
    setError(null);
    const { error: err, row: saved } = await togglePersonalContaPago(row.id, next);
    setSavingId(null);
    if (err) {
      onPatch(row.id, { pago: row.pago });
      setError(err);
      onSyncError();
    } else if (saved) {
      onUpsert(saved);
    }
  };

  const handleDelete = async (row: HubPersonalTransaction) => {
    if (!confirm(`Remover "${row.descricao}"?`)) return;
    onRemove(row.id);
    const err = await deletePersonalConta(row.id);
    if (err) {
      setError(err);
      onUpsert(row);
      onSyncError();
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.summaryBar}>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryChip}>
            <img src="/img/personal/grupo-fixos.svg" alt="" className={styles.summaryIcon} aria-hidden />
            <span>
              Fixos <strong>{formatBRL(summary.fixos)}</strong>
            </span>
          </div>
          <div className={styles.summaryChip}>
            <img src="/img/personal/grupo-variaveis.svg" alt="" className={styles.summaryIcon} aria-hidden />
            <span>
              Variáveis <strong>{formatBRL(summary.variaveis)}</strong>
            </span>
          </div>
          <div className={styles.summaryChip}>
            <img src="/img/finance/recebido.svg" alt="" className={styles.summaryIcon} aria-hidden />
            <span>
              Pago <strong>{formatBRL(summary.valorPago)}</strong>
            </span>
          </div>
          <div className={styles.summaryChip}>
            <img src="/img/finance/pendente.svg" alt="" className={styles.summaryIcon} aria-hidden />
            <span>
              A pagar <strong>{formatBRL(summary.valorAPagar)}</strong>
            </span>
          </div>
        </div>
        <p className={styles.summaryHint}>
          Fixos + VR {formatBRL(VINICIUS_VR_MENSAL)} · edite valores e totais atualizam na hora.
        </p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {editing && (
        <PersonalContaFixaForm
          grupo={editing.grupo!}
          rows={rows}
          recordId={editing.id}
          initialValues={editing}
          onSaved={(row) => {
            onUpsert(row);
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className={styles.grid}>
        {PESSOAL_CONTA_GRUPOS.map((grupo) => {
          const items = byGrupo[grupo.id];
          const visual = GRUPO_VISUAL[grupo.id];
          const subtotal = sumGrupo(items);
          const subtotalPago = sumGrupoPago(items);
          const paid = paidCount(items);
          const pct = items.length ? Math.round((paid / items.length) * 100) : 0;

          return (
            <section
              key={grupo.id}
              className={`${styles.grupoCard} ${grupo.variavel ? styles.grupoVariavel : ''}`}
              style={
                {
                  '--accent': visual.accent,
                  '--glow': visual.glow,
                } as CSSProperties
              }
            >
              <header className={styles.grupoHead}>
                <img src={visual.icon} alt="" className={styles.grupoIcon} aria-hidden />
                <div className={styles.grupoMeta}>
                  <h3 className={styles.grupoTitle}>{grupo.label}</h3>
                  <span className={styles.grupoTag}>{visual.label}</span>
                </div>
                <div className={styles.grupoStats}>
                  {items.length > 0 && (
                    <>
                      <span className={styles.grupoTotal}>{formatBRL(subtotal)}</span>
                      <span className={styles.grupoPago}>{formatBRL(subtotalPago)} pago</span>
                      <span className={styles.grupoPct}>{pct}% pago</span>
                    </>
                  )}
                </div>
              </header>

              {addingGrupo === grupo.id && (
                <div className={styles.formWrap}>
                  <PersonalContaFixaForm
                    grupo={grupo.id}
                    rows={rows}
                    onSaved={(row) => {
                      onUpsert(row);
                      setAddingGrupo(null);
                    }}
                    onCancel={() => setAddingGrupo(null)}
                  />
                </div>
              )}

              <ul className={styles.lista}>
                {items.map((row) => {
                  const provider = providerVisual(row.notas);
                  const icon = itemIcon(row.descricao, row.categoria);
                  return (
                    <li key={row.id} className={styles.item}>
                      <div
                        className={`${styles.itemCard} ${row.pago ? styles.itemCardPago : ''}`}
                      >
                        <label className={styles.itemCheck}>
                          <input
                            type="checkbox"
                            className={styles.checkbox}
                            checked={Boolean(row.pago)}
                            disabled={savingId === row.id}
                            onChange={() => void togglePago(row)}
                          />
                        </label>
                        <img src={icon} alt="" className={styles.itemIcon} aria-hidden />
                        <span className={styles.itemMain}>
                          <span className={styles.itemTitle}>{row.descricao}</span>
                          <span className={styles.itemMeta}>
                            {provider && (
                              <span
                                className={styles.providerChip}
                                style={{ background: provider.bg, color: provider.color }}
                              >
                                {provider.abbr}
                              </span>
                            )}
                            {row.dia_vencimento != null && (
                              <span className={styles.diaChip}>Dia {row.dia_vencimento}</span>
                            )}
                            {row.notas && !provider && (
                              <span className={styles.noteChip}>{row.notas}</span>
                            )}
                          </span>
                        </span>
                        <strong className={styles.itemValor}>{formatBRL(Number(row.valor))}</strong>
                        <div className={styles.itemActions}>
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => {
                              setAddingGrupo(null);
                              setEditing(row);
                            }}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => void handleDelete(row)}
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {items.length === 0 && !addingGrupo && (
                <p className={styles.empty}>Nenhuma conta neste grupo.</p>
              )}

              {addingGrupo !== grupo.id && (
                <button
                  type="button"
                  className={styles.addBtn}
                  onClick={() => {
                    setEditing(null);
                    setAddingGrupo(grupo.id);
                  }}
                >
                  + Adicionar conta
                </button>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
