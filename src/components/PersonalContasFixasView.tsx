import { useMemo, useState } from 'react';
import { formatBRL } from '../lib/format';
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

function formatItemLine(row: HubPersonalTransaction): string {
  const valor = formatBRL(Number(row.valor));
  const provedor = row.notas?.trim();
  const provedorLabel = provedor ? ` [${provedor}]` : '';
  const dia =
    row.dia_vencimento != null ? ` | Dia ${row.dia_vencimento}` : '';
  if (row.grupo === 'variaveis' && provedor) {
    return `${row.descricao} | ${provedor}: ${valor}`;
  }
  return `${row.descricao}${provedorLabel} = ${valor}${dia}`;
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
      <header className={styles.hero}>
        <h2 className={styles.heroTitle}>
          Contas Fixas [{formatBRL(totalFixos)} + {formatBRL(VINICIUS_VR_MENSAL)} VR]
        </h2>
        <p className={styles.heroHint}>
          Marque conforme for pagando. Só você vê esta lista.
        </p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {PESSOAL_CONTA_GRUPOS.map((grupo) => {
        const items = byGrupo[grupo.id];
        const subtotal = sumGrupo(items);
        return (
          <section
            key={grupo.id}
            className={`${styles.grupo} ${grupo.variavel ? styles.grupoVariavel : ''}`}
          >
            <h3 className={styles.grupoTitle}>
              {grupo.label}
              {!grupo.variavel && items.length > 0 && (
                <span className={styles.grupoTotal}> — {formatBRL(subtotal)}</span>
              )}
            </h3>
            <ul className={styles.lista}>
              {items.map((row) => (
                <li key={row.id} className={styles.item}>
                  <label className={styles.itemLabel}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={Boolean(row.pago)}
                      disabled={savingId === row.id}
                      onChange={() => void togglePago(row)}
                    />
                    <span
                      className={`${styles.itemText} ${row.pago ? styles.itemTextPago : ''}`}
                    >
                      {formatItemLine(row)}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            {items.length === 0 && (
              <p className={styles.empty}>Nenhuma conta neste grupo.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
