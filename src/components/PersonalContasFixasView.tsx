import { useMemo, useState, type CSSProperties } from 'react';
import { formatBRL } from '../lib/format';
import {
  GRUPO_VISUAL,
  itemIcon,
  providerVisual,
} from '../lib/personalFinanceVisuals';
import { supabase, supabaseErrorMessage } from '../lib/supabase';
import {
  PESSOAL_CONTA_GRUPOS,
  VINICIUS_VR_MENSAL,
} from '../lib/viniciusPersonalFinance';
import type { HubPersonalContaGrupo, HubPersonalTransaction } from '../types/database';
import styles from './PersonalContasFixasView.module.css';

function sumGrupo(rows: HubPersonalTransaction[]): number {
  return rows.reduce((sum, row) => sum + Number(row.valor), 0);
}

function paidCount(items: HubPersonalTransaction[]): number {
  return items.filter((i) => i.pago).length;
}

interface PersonalContasFixasViewProps {
  rows: HubPersonalTransaction[];
  onRefresh: () => void;
}

export function PersonalContasFixasView({ rows, onRefresh }: PersonalContasFixasViewProps) {
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

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

  const totalFixos =
    sumGrupo(byGrupo.residencial) +
    sumGrupo(byGrupo.carro) +
    sumGrupo(byGrupo.gastos_fixos);

  const togglePago = async (row: HubPersonalTransaction) => {
    if (!supabase) return;
    setSavingId(row.id);
    setError(null);
    const { error: err } = await supabase
      .from('hub_personal_transactions')
      .update({ pago: !row.pago, updated_at: new Date().toISOString() })
      .eq('id', row.id);
    setSavingId(null);
    if (err) setError(supabaseErrorMessage(err));
    else onRefresh();
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.summaryBar}>
        <div className={styles.summaryChip}>
          <img src="/img/personal/grupo-fixos.svg" alt="" className={styles.summaryIcon} aria-hidden />
          <span>
            Fixos <strong>{formatBRL(totalFixos)}</strong> + VR {formatBRL(VINICIUS_VR_MENSAL)}
          </span>
        </div>
        <p className={styles.summaryHint}>Marque conforme for pagando — checklist privado.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className={styles.grid}>
        {PESSOAL_CONTA_GRUPOS.map((grupo) => {
          const items = byGrupo[grupo.id];
          const visual = GRUPO_VISUAL[grupo.id];
          const subtotal = sumGrupo(items);
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
                  {!grupo.variavel && items.length > 0 && (
                    <span className={styles.grupoTotal}>{formatBRL(subtotal)}</span>
                  )}
                  {items.length > 0 && (
                    <span className={styles.grupoPct}>{pct}% pago</span>
                  )}
                </div>
              </header>

              <ul className={styles.lista}>
                {items.map((row) => {
                  const provider = providerVisual(row.notas);
                  const icon = itemIcon(row.descricao, row.categoria);
                  return (
                    <li key={row.id} className={styles.item}>
                      <label
                        className={`${styles.itemCard} ${row.pago ? styles.itemCardPago : ''}`}
                      >
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={Boolean(row.pago)}
                          disabled={savingId === row.id}
                          onChange={() => void togglePago(row)}
                        />
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
                      </label>
                    </li>
                  );
                })}
              </ul>

              {items.length === 0 && (
                <p className={styles.empty}>Nenhuma conta neste grupo.</p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
