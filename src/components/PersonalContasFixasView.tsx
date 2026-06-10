import { useMemo, useState, type CSSProperties } from 'react';

import { formatBRL } from '../lib/format';

import {
  GRUPO_VISUAL,
  formatContaTitulo,
  providerVisual,
} from '../lib/personalFinanceVisuals';

import type { PessoalFinanceSummary } from '../lib/pessoalFinanceSummary';

import {

  grupoContaLabel,

  PESSOAL_CONTA_GRUPOS,

} from '../lib/viniciusPersonalFinance';

import type { HubPersonalContaGrupo, HubPersonalTransaction } from '../types/database';

import {

  deletePersonalConta,

  PersonalContaFixaForm,

  togglePersonalContaPago,

} from './personal/PersonalContaFixaForm';

import { PersonalFinanceConfirmModal } from './personal/PersonalFinanceConfirmModal';
import { PersonalFinanceModal } from './personal/PersonalFinanceModal';

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

  defaultDate: string;

  onUpsert: (row: HubPersonalTransaction) => void;

  onRemove: (id: string) => void;

  onPatch: (id: string, patch: Partial<HubPersonalTransaction>) => void;

  onSyncError: () => void;

}



export function PersonalContasFixasView({
  rows,
  summary: _summary,
  defaultDate,

  onUpsert,

  onRemove,

  onPatch,

  onSyncError,

}: PersonalContasFixasViewProps) {

  const [error, setError] = useState<string | null>(null);

  const [savingId, setSavingId] = useState<string | null>(null);

  const [addingGrupo, setAddingGrupo] = useState<HubPersonalContaGrupo | null>(null);

  const [editing, setEditing] = useState<HubPersonalTransaction | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<HubPersonalTransaction | null>(null);
  const [collapsed, setCollapsed] = useState<Set<HubPersonalContaGrupo>>(() => new Set());



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
    onRemove(row.id);
    const err = await deletePersonalConta(row.id);
    if (err) {
      setError(err);
      onUpsert(row);
      onSyncError();
    }
  };

  const closeFormModal = () => {
    setEditing(null);
    setAddingGrupo(null);
  };



  const toggleGrupo = (grupoId: HubPersonalContaGrupo) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(grupoId)) next.delete(grupoId);
      else next.add(grupoId);
      return next;
    });
  };

  return (
    <div className={styles.wrap}>
      {error && <div className="error-banner">{error}</div>}



      <div className={styles.grid}>

        {PESSOAL_CONTA_GRUPOS.map((grupo) => {

          const items = byGrupo[grupo.id];

          const visual = GRUPO_VISUAL[grupo.id];

          const subtotal = sumGrupo(items);

          const subtotalPago = sumGrupoPago(items);

          const paid = paidCount(items);

          const pct = items.length ? Math.round((paid / items.length) * 100) : 0;
          const isCollapsed = collapsed.has(grupo.id);

          return (
            <section
              key={grupo.id}
              className={`${styles.grupoCard} ${grupo.variavel ? styles.grupoVariavel : ''} ${isCollapsed ? styles.grupoCollapsed : ''}`}

              style={

                {

                  '--accent': visual.accent,

                  '--glow': visual.glow,

                } as CSSProperties

              }

            >

              <button
                type="button"
                className={styles.grupoHead}
                aria-expanded={!isCollapsed}
                onClick={() => toggleGrupo(grupo.id)}
              >
                <div
                  className={`${styles.grupoIconWrap} ${visual.photo ? styles.grupoIconWrapPhoto : ''}`}
                >
                  <img
                    src={visual.icon}
                    alt=""
                    className={`${styles.grupoIcon} ${visual.photo ? styles.grupoIconPhoto : ''}`}
                    aria-hidden
                  />
                </div>

                <div className={styles.grupoMeta}>
                  <h3 className={styles.grupoTitle}>{grupo.label}</h3>
                  <span className={styles.grupoTag}>{visual.label}</span>
                </div>

                <div className={styles.grupoStats}>
                  {items.length > 0 ? (
                    <>
                      <span className={styles.grupoTotal}>{formatBRL(subtotal)}</span>
                      <span className={styles.grupoCount}>
                        {paid}/{items.length} · {pct}%
                      </span>
                    </>
                  ) : (
                    <span className={styles.grupoEmptyTag}>Vazio</span>
                  )}
                </div>

                <span className={styles.grupoChevron} aria-hidden>
                  {isCollapsed ? '▸' : '▾'}
                </span>

                {items.length > 0 && (
                  <div
                    className={styles.grupoProgressTrack}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${formatBRL(subtotalPago)} pago`}
                  >
                    <div className={styles.grupoProgressFill} style={{ width: `${pct}%` }} />
                  </div>
                )}
              </button>

              {!isCollapsed && (
              <ul className={styles.lista}>

                {items.map((row) => {
                  const provider = providerVisual(row.notas);
                  return (

                    <li key={row.id} className={styles.item}>

                      <div

                        className={`${styles.itemCard} ${row.pago ? styles.itemCardPago : ''}`}

                      >

                        <label className={styles.itemCheck} aria-label={row.pago ? 'Marcar pendente' : 'Marcar pago'}>

                          <input

                            type="checkbox"

                            className={styles.checkbox}

                            checked={Boolean(row.pago)}

                            disabled={savingId === row.id}

                            onChange={() => void togglePago(row)}

                          />

                          <span className={styles.checkVisual} aria-hidden />

                        </label>

                        <div className={styles.itemMain}>
                          <span className={styles.itemTitle}>{formatContaTitulo(row.descricao)}</span>
                          {(provider || row.dia_vencimento != null || (row.notas && !provider)) && (
                          <span className={styles.itemMeta}>
                            {provider && (
                              <span
                                className={styles.providerChip}
                                style={{ background: provider.bg, color: provider.color }}
                              >
                                {provider.label}
                              </span>
                            )}
                            {row.dia_vencimento != null && (
                              <span className={styles.diaChip}>Dia {row.dia_vencimento}</span>
                            )}
                            {row.notas && !provider && (
                              <span className={styles.noteChip}>{row.notas}</span>
                            )}
                          </span>
                          )}
                        </div>

                        <strong className={styles.itemValor}>{formatBRL(Number(row.valor))}</strong>



                        <div className={styles.itemActions}>

                          <button
                            type="button"
                            className={styles.actionBtn}
                            title="Editar"
                            aria-label="Editar"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddingGrupo(null);
                              setEditing(row);
                            }}
                          >
                            <span className={styles.actionIcon} aria-hidden>✎</span>
                            <span className={styles.actionText}>Editar</span>
                          </button>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionDanger}`}
                            title="Remover"
                            aria-label="Remover"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(row);
                            }}
                          >
                            <span className={styles.actionIcon} aria-hidden>×</span>
                            <span className={styles.actionText}>Remover</span>
                          </button>

                        </div>

                      </div>

                    </li>

                  );

                })}

              </ul>
              )}

              {!isCollapsed && items.length === 0 && (
                <div className={styles.emptyState}>

                  <img
                    src={visual.icon}
                    alt=""
                    className={`${styles.emptyIcon} ${visual.photo ? styles.emptyIconPhoto : ''}`}
                    aria-hidden
                  />

                  <p className={styles.empty}>Nenhuma conta neste grupo ainda.</p>

                </div>

              )}

              {!isCollapsed && (
              <button
                type="button"
                className={styles.addBtn}
                onClick={() => {
                  setEditing(null);
                  setAddingGrupo(grupo.id);
                }}
              >
                <span className={styles.addBtnIcon} aria-hidden>+</span>
                Adicionar
              </button>
              )}

            </section>

          );

        })}

      </div>

      <PersonalFinanceModal
        open={editing !== null || addingGrupo !== null}
        title={
          editing
            ? `Editar · ${formatContaTitulo(editing.descricao)}`
            : addingGrupo
              ? `Nova conta · ${grupoContaLabel(addingGrupo)}`
              : 'Conta'
        }
        onClose={closeFormModal}
      >
        {editing ? (
          <PersonalContaFixaForm
            grupo={editing.grupo!}
            rows={rows}
            recordId={editing.id}
            initialValues={editing}
            defaultDate={defaultDate}
            hideHeader
            onSaved={(row) => {
              onUpsert(row);
              closeFormModal();
            }}
            onCancel={closeFormModal}
          />
        ) : (
          addingGrupo && (
            <PersonalContaFixaForm
              grupo={addingGrupo}
              rows={rows}
              defaultDate={defaultDate}
              hideHeader
              onSaved={(row) => {
                onUpsert(row);
                closeFormModal();
              }}
              onCancel={closeFormModal}
            />
          )
        )}
      </PersonalFinanceModal>

      <PersonalFinanceConfirmModal
        open={deleteTarget !== null}
        title="Remover conta"
        message={
          deleteTarget
            ? `Remover "${formatContaTitulo(deleteTarget.descricao)}"? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Remover"
        danger
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) void handleDelete(deleteTarget);
        }}
      />

    </div>

  );

}


