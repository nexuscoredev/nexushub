import { useState } from 'react';
import { formatBRL, formatDate } from '../../lib/format';
import { formatMonthLabel } from '../../lib/personalFinanceMonth';
import { categoriaPessoalLabel } from '../../lib/pessoal';
import { itemIcon } from '../../lib/personalFinanceVisuals';
import {
  deletePersonalRow,
  PersonalCrudBar,
  PersonalRecordForm,
} from '../PersonalFinanceCrud';
import type { HubPersonalTipo, HubPersonalTransaction } from '../../types/database';
import styles from './PersonalTransactionCards.module.css';

interface PersonalTransactionCardsProps {
  rows: HubPersonalTransaction[];
  presetTipo: HubPersonalTipo;
  defaultDate: string;
  monthLabel: string;
  onUpsert: (row: HubPersonalTransaction) => void;
  onRemove: (id: string) => void;
  onSyncError: () => void;
}

export function PersonalTransactionCards({
  rows,
  presetTipo,
  defaultDate,
  monthLabel,
  onUpsert,
  onRemove,
  onSyncError,
}: PersonalTransactionCardsProps) {
  const [editing, setEditing] = useState<HubPersonalTransaction | null>(null);

  const handleDelete = async (row: HubPersonalTransaction) => {
    if (!confirm('Excluir este lançamento?')) return;
    onRemove(row.id);
    const err = await deletePersonalRow(row.id);
    if (err) {
      alert(err);
      onUpsert(row);
      onSyncError();
    }
  };

  const isEntrada = presetTipo === 'entrada';
  const tipoLabel = isEntrada ? 'receita' : 'gasto';

  return (
    <div className={styles.wrap}>
      <PersonalCrudBar
        presetTipo={presetTipo}
        defaultDate={defaultDate}
        onSaved={(row) => {
          if (row) onUpsert(row);
          else onSyncError();
        }}
      />
      {editing && (
        <PersonalRecordForm
          recordId={editing.id}
          initialValues={editing as unknown as Record<string, unknown>}
          defaultDate={defaultDate}
          onSaved={(row) => {
            if (row) onUpsert(row);
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      <ul className={styles.list}>
        {rows.map((row) => (
          <li key={row.id} className={`${styles.card} ${isEntrada ? styles.cardEntrada : styles.cardSaida}`}>
            <img
              src={itemIcon(row.descricao, row.categoria)}
              alt=""
              className={styles.cardIcon}
              aria-hidden
            />
            <div className={styles.cardBody}>
              <span className={styles.cardTitle}>{row.descricao}</span>
              <span className={styles.cardMeta}>
                {categoriaPessoalLabel(row.categoria)} · {formatDate(row.data_referencia)}
                {row.notas ? ` · ${row.notas}` : ''}
              </span>
            </div>
            <strong className={styles.cardValor}>{formatBRL(Number(row.valor))}</strong>
            <div className={styles.cardActions}>
              <button type="button" className="btn-ghost" onClick={() => setEditing(row)}>
                Editar
              </button>
              <button type="button" className="btn-ghost" onClick={() => void handleDelete(row)}>
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>

      {rows.length === 0 && (
        <div className={styles.empty}>
          <p>Nenhum {tipoLabel} em {formatMonthLabel(monthLabel)}.</p>
          <p className={styles.emptyHint}>Use o botão acima para adicionar.</p>
        </div>
      )}
    </div>
  );
}
