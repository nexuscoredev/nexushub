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

  defaultDate: string;

  onUpsert: (row: HubPersonalTransaction) => void;

  onRemove: (id: string) => void;

  onPatch: (id: string, patch: Partial<HubPersonalTransaction>) => void;

  onSyncError: () => void;

}



export function PersonalContasFixasView({

  rows,

  summary,

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



  const totalContas = summary.totalContasChecklist;

  const pagasCount = contasRows.filter((r) => r.pago).length;



  return (

    <div className={styles.wrap}>

      <section className={styles.overview} aria-label="Resumo das contas fixas">

        <div className={styles.overviewHead}>

          <div className={styles.overviewCopy}>

            <span className={styles.overviewBadge}>Checklist mensal</span>

            <h2 className={styles.overviewTitle}>Contas fixas</h2>

            <p className={styles.overviewSub}>

              {pagasCount} de {totalContas} pagas · Fixos + VR {formatBRL(VINICIUS_VR_MENSAL)}

            </p>

          </div>

          <div

            className={styles.progressRing}

            style={{ '--pct': `${summary.percentualPagas}%` } as CSSProperties}

            aria-hidden

          >

            <span className={styles.progressRingValue}>{summary.percentualPagas}%</span>

          </div>

        </div>



        <div

          className={styles.progressTrack}

          role="progressbar"

          aria-valuenow={summary.percentualPagas}

          aria-valuemin={0}

          aria-valuemax={100}

          aria-label="Progresso de pagamento"

        >

          <div

            className={styles.progressFill}

            style={{ width: `${summary.percentualPagas}%` }}

          />

        </div>



      </section>



      {error && <div className="error-banner">{error}</div>}



      {editing && (

        <div className={styles.formPanel}>

          <PersonalContaFixaForm

            grupo={editing.grupo!}

            rows={rows}

            recordId={editing.id}

            initialValues={editing}

            defaultDate={defaultDate}

            onSaved={(row) => {

              onUpsert(row);

              setEditing(null);

            }}

            onCancel={() => setEditing(null)}

          />

        </div>

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

                <div className={styles.grupoHeadTop}>

                  <div className={styles.grupoIconWrap}>

                    <img src={visual.icon} alt="" className={styles.grupoIcon} aria-hidden />

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

                          {paid}/{items.length} pagas

                        </span>

                      </>

                    ) : (

                      <span className={styles.grupoEmptyTag}>Vazio</span>

                    )}

                  </div>

                </div>



                {items.length > 0 && (

                  <div className={styles.grupoProgress}>

                    <div className={styles.grupoProgressMeta}>

                      <span className={styles.grupoPago}>{formatBRL(subtotalPago)} pago</span>

                      <span className={styles.grupoPct}>{pct}%</span>

                    </div>

                    <div className={styles.grupoProgressTrack}>

                      <div

                        className={styles.grupoProgressFill}

                        style={{ width: `${pct}%` }}

                      />

                    </div>

                  </div>

                )}

              </header>



              {addingGrupo === grupo.id && (

                <div className={styles.formWrap}>

                  <PersonalContaFixaForm

                    grupo={grupo.id}

                    rows={rows}

                    defaultDate={defaultDate}

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



                        <div className={styles.itemIconWrap}>

                          <img src={icon} alt="" className={styles.itemIcon} aria-hidden />

                        </div>



                        <div className={styles.itemMain}>

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

                        </div>



                        <strong className={styles.itemValor}>{formatBRL(Number(row.valor))}</strong>



                        <div className={styles.itemActions}>

                          <button

                            type="button"

                            className={styles.actionBtn}

                            title="Editar"

                            onClick={() => {

                              setAddingGrupo(null);

                              setEditing(row);

                            }}

                          >

                            Editar

                          </button>

                          <button

                            type="button"

                            className={`${styles.actionBtn} ${styles.actionDanger}`}

                            title="Remover"

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

                <div className={styles.emptyState}>

                  <img src={visual.icon} alt="" className={styles.emptyIcon} aria-hidden />

                  <p className={styles.empty}>Nenhuma conta neste grupo ainda.</p>

                </div>

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

                  <span className={styles.addBtnIcon} aria-hidden>+</span>

                  Adicionar conta

                </button>

              )}

            </section>

          );

        })}

      </div>

    </div>

  );

}


