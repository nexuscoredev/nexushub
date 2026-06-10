import { useState } from 'react';
import { formatBRL, formatDate } from '../../lib/format';
import { formatMonthLabel } from '../../lib/personalFinanceMonth';
import { categoriaPessoalLabel } from '../../lib/pessoal';
import { formatContaTitulo, itemIcon } from '../../lib/personalFinanceVisuals';
import { PersonalFinanceConfirmModal } from './PersonalFinanceConfirmModal';
import { PersonalFinanceModal } from './PersonalFinanceModal';
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
  const [deleteTarget, setDeleteTarget] = useState<HubPersonalTransaction | null>(null);

  const handleDelete = async (row: HubPersonalTransaction) => {
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
              <span className={styles.cardTitle}>{formatContaTitulo(row.descricao)}</span>
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
              <button type="button" className="btn-ghost" onClick={() => setDeleteTarget(row)}>
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

      <PersonalFinanceModal
        open={editing !== null}
        title={editing ? `Editar · ${formatContaTitulo(editing.descricao)}` : 'Editar lançamento'}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <PersonalRecordForm
            recordId={editing.id}
            initialValues={editing as unknown as Record<string, unknown>}
            defaultDate={defaultDate}
            hideHeader
            onSaved={(row) => {
              if (row) onUpsert(row);
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </PersonalFinanceModal>

      <PersonalFinanceConfirmModal
        open={deleteTarget !== null}
        title="Excluir lançamento"
        message={
          deleteTarget
            ? `Excluir "${formatContaTitulo(deleteTarget.descricao)}"? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        danger
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) void handleDelete(deleteTarget);
        }}
      />
    </div>
  );
}
