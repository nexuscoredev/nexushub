import { useState } from 'react';
import { formatBRL, formatDate } from '../../lib/format';
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
  onRefresh: () => void;
}

export function PersonalTransactionCards({
  rows,
  presetTipo,
  onRefresh,
}: PersonalTransactionCardsProps) {
  const [editing, setEditing] = useState<HubPersonalTransaction | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este lançamento?')) return;
    const err = await deletePersonalRow(id);
    if (err) alert(err);
    else onRefresh();
  };

  const isEntrada = presetTipo === 'entrada';

  return (
    <div className={styles.wrap}>
      <PersonalCrudBar presetTipo={presetTipo} onSaved={onRefresh} />
      {editing && (
        <PersonalRecordForm
          recordId={editing.id}
          initialValues={editing as unknown as Record<string, unknown>}
          onSaved={() => {
            setEditing(null);
            onRefresh();
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
              <button type="button" className="btn-ghost" onClick={() => void handleDelete(row.id)}>
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>

      {rows.length === 0 && (
        <p className={styles.empty}>Nenhum lançamento ainda. Adicione o primeiro acima.</p>
      )}
    </div>
  );
}
