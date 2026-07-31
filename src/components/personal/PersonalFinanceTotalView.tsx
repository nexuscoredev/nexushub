import { FormEvent, useState } from 'react';
import { formatBRL } from '../../lib/format';
import {
  MACRO_SECTIONS,
  deletePersonalFinanceMacroItem,
  formatMacroSectionTotal,
  nextMacroOrdem,
  sectionParcelasTotal,
  upsertPersonalFinanceMacroItem,
  type MacroSectionConfig,
} from '../../lib/personalFinanceMacro';
import type {
  HubPersonalFinanceMacroCategoria,
  HubPersonalFinanceMacroItem,
} from '../../types/database';
import { PersonalFinanceConfirmModal } from './PersonalFinanceConfirmModal';
import { PersonalFinanceModal } from './PersonalFinanceModal';
import { PersonalFinanceSection } from './PersonalFinanceNav';
import formStyles from './PersonalFinanceForm.module.css';
import styles from './PersonalFinanceTotalView.module.css';

interface PersonalFinanceTotalViewProps {
  userId: string | undefined;
  items: HubPersonalFinanceMacroItem[];
  loading?: boolean;
  onUpsert: (item: HubPersonalFinanceMacroItem) => void;
  onRemove: (id: string) => void;
  onSyncError: () => void;
}

function MacroItemForm({
  section,
  items,
  userId,
  record,
  onSaved,
  onCancel,
}: {
  section: MacroSectionConfig;
  items: HubPersonalFinanceMacroItem[];
  userId: string;
  record?: HubPersonalFinanceMacroItem;
  onSaved: (item: HubPersonalFinanceMacroItem) => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(record);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;
    setError(null);
    setSaving(true);

    const fd = new FormData(e.currentTarget);
    const titulo = String(fd.get('titulo') ?? '').trim();
    if (!titulo) {
      setError('Informe um título.');
      setSaving(false);
      return;
    }

    const valorMensalRaw = String(fd.get('valor_mensal') ?? '').trim();
    const saldoRestanteRaw = String(fd.get('saldo_restante') ?? '').trim();
    const parcelasRaw = String(fd.get('parcelas_restantes') ?? '').trim();
    const notas = String(fd.get('notas') ?? '').trim();

    const input = {
      categoria: section.id,
      titulo,
      valor_mensal: valorMensalRaw ? Number(valorMensalRaw) : null,
      saldo_restante: saldoRestanteRaw ? Number(saldoRestanteRaw) : null,
      parcelas_restantes: parcelasRaw ? Number(parcelasRaw) : null,
      notas: notas || null,
      ordem: record?.ordem ?? nextMacroOrdem(items, section.id),
    };

    if (section.id === 'divida_atual' && input.saldo_restante == null) {
      setError('Informe o saldo restante.');
      setSaving(false);
      return;
    }
    if (section.id !== 'divida_atual' && input.valor_mensal == null) {
      setError('Informe o valor mensal.');
      setSaving(false);
      return;
    }

    const { item, error: err } = await upsertPersonalFinanceMacroItem(userId, input, record?.id);
    setSaving(false);
    if (err || !item) {
      setError(err ?? 'Não foi possível salvar.');
      return;
    }
    onSaved(item);
  };

  return (
    <form className={formStyles.form} onSubmit={(e) => void handleSubmit(e)}>
      <div className={formStyles.grid}>
        <label className={`${formStyles.field} ${formStyles.fieldFull}`}>
          <span className={formStyles.label}>Título</span>
          <input
            className={formStyles.input}
            name="titulo"
            defaultValue={record?.titulo ?? ''}
            placeholder="Ex.: Financiamento do carro"
            required
          />
        </label>

        {section.id === 'divida_atual' ? (
          <>
            <label className={formStyles.field}>
              <span className={formStyles.label}>Saldo restante (R$)</span>
              <input
                className={formStyles.input}
                name="saldo_restante"
                type="number"
                min="0"
                step="0.01"
                defaultValue={record?.saldo_restante ?? ''}
                placeholder="0,00"
                required
              />
            </label>
            <label className={formStyles.field}>
              <span className={formStyles.label}>Parcelas restantes</span>
              <input
                className={formStyles.input}
                name="parcelas_restantes"
                type="number"
                min="0"
                step="1"
                defaultValue={record?.parcelas_restantes ?? ''}
                placeholder="Opcional"
              />
            </label>
          </>
        ) : (
          <>
            <label className={formStyles.field}>
              <span className={formStyles.label}>Valor mensal (R$)</span>
              <input
                className={formStyles.input}
                name="valor_mensal"
                type="number"
                min="0"
                step="0.01"
                defaultValue={record?.valor_mensal ?? ''}
                placeholder="0,00"
                required
              />
            </label>
            {section.showParcelas && (
              <label className={formStyles.field}>
                <span className={formStyles.label}>Parcelas restantes</span>
                <input
                  className={formStyles.input}
                  name="parcelas_restantes"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={record?.parcelas_restantes ?? ''}
                  placeholder="Ex.: 12"
                />
              </label>
            )}
          </>
        )}

        <label className={`${formStyles.field} ${formStyles.fieldFull}`}>
          <span className={formStyles.label}>Notas</span>
          <input
            className={formStyles.input}
            name="notas"
            defaultValue={record?.notas ?? ''}
            placeholder="Opcional"
          />
        </label>
      </div>

      {error && <p className={formStyles.error}>{error}</p>}

      <div className={formStyles.actions}>
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Salvando…' : isEdit ? 'Salvar' : 'Adicionar'}
        </button>
      </div>
    </form>
  );
}

function MacroItemRow({
  item,
  section,
  onEdit,
  onDelete,
}: {
  item: HubPersonalFinanceMacroItem;
  section: MacroSectionConfig;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const mainValue =
    section.id === 'divida_atual'
      ? formatBRL(Number(item.saldo_restante ?? 0))
      : formatBRL(Number(item.valor_mensal ?? 0));

  const metaParts: string[] = [];
  if (section.id === 'divida_atual' && item.parcelas_restantes != null) {
    metaParts.push(`${item.parcelas_restantes} parcela${item.parcelas_restantes === 1 ? '' : 's'}`);
  }
  if (section.id === 'a_receber' && item.parcelas_restantes != null) {
    metaParts.push(`${item.parcelas_restantes} parcela${item.parcelas_restantes === 1 ? '' : 's'} restantes`);
    if (item.valor_mensal != null) {
      metaParts.push(`Total: ${formatBRL(Number(item.valor_mensal) * item.parcelas_restantes)}`);
    }
  }
  if (item.notas) metaParts.push(item.notas);

  return (
    <li className={styles.item}>
      <div className={styles.itemBody}>
        <span className={styles.itemTitle}>{item.titulo}</span>
        {metaParts.length > 0 && <span className={styles.itemMeta}>{metaParts.join(' · ')}</span>}
      </div>
      <strong className={styles.itemValue}>{mainValue}</strong>
      <div className={styles.itemActions}>
        <button type="button" className="btn-ghost" onClick={onEdit}>
          Editar
        </button>
        <button type="button" className="btn-ghost" onClick={onDelete}>
          Excluir
        </button>
      </div>
    </li>
  );
}

export function PersonalFinanceTotalView({
  userId,
  items,
  loading,
  onUpsert,
  onRemove,
  onSyncError,
}: PersonalFinanceTotalViewProps) {
  const [addSection, setAddSection] = useState<HubPersonalFinanceMacroCategoria | null>(null);
  const [editTarget, setEditTarget] = useState<HubPersonalFinanceMacroItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HubPersonalFinanceMacroItem | null>(null);

  const handleDelete = async (item: HubPersonalFinanceMacroItem) => {
    if (!userId) return;
    onRemove(item.id);
    const err = await deletePersonalFinanceMacroItem(userId, item.id);
    if (err) {
      alert(err);
      onUpsert(item);
      onSyncError();
    }
  };

  const activeSection = MACRO_SECTIONS.find(
    (section) => section.id === (editTarget?.categoria ?? addSection),
  );

  return (
    <div className={styles.wrap}>
      <p className={styles.intro}>
        Visão macro das suas finanças — dívidas, recebíveis e assinaturas fora do fluxo mensal das
        contas.
      </p>

      {MACRO_SECTIONS.map((section) => {
        const sectionItems = items.filter((item) => item.categoria === section.id);
        const parcelas = section.showParcelas ? sectionParcelasTotal(items, section.id) : 0;
        const subtitle =
          section.showParcelas && parcelas > 0
            ? `${section.subtitle} · ${parcelas} parcela${parcelas === 1 ? '' : 's'} no total`
            : section.subtitle;

        return (
          <PersonalFinanceSection
            key={section.id}
            icon={section.icon}
            accent={section.accent}
            title={section.label}
            subtitle={subtitle}
            total={`${section.totalLabel}: ${loading ? '…' : formatMacroSectionTotal(items, section)}`}
          >
            <div className={styles.sectionToolbar}>
              <button
                type="button"
                className={styles.addBtn}
                onClick={() => setAddSection(section.id)}
                disabled={!userId || loading}
              >
                + Adicionar
              </button>
            </div>

            {loading ? (
              <p className={styles.loading}>Carregando…</p>
            ) : sectionItems.length === 0 ? (
              <p className={styles.empty}>Nenhum item cadastrado.</p>
            ) : (
              <ul className={styles.list}>
                {sectionItems.map((item) => (
                  <MacroItemRow
                    key={item.id}
                    item={item}
                    section={section}
                    onEdit={() => setEditTarget(item)}
                    onDelete={() => setDeleteTarget(item)}
                  />
                ))}
              </ul>
            )}
          </PersonalFinanceSection>
        );
      })}

      <PersonalFinanceModal
        open={addSection !== null || editTarget !== null}
        title={
          editTarget
            ? `Editar · ${editTarget.titulo}`
            : activeSection
              ? `Adicionar · ${activeSection.label}`
              : 'Item macro'
        }
        onClose={() => {
          setAddSection(null);
          setEditTarget(null);
        }}
      >
        {activeSection && userId && (
          <MacroItemForm
            section={activeSection}
            items={items}
            userId={userId}
            record={editTarget ?? undefined}
            onSaved={(item) => {
              onUpsert(item);
              setAddSection(null);
              setEditTarget(null);
            }}
            onCancel={() => {
              setAddSection(null);
              setEditTarget(null);
            }}
          />
        )}
      </PersonalFinanceModal>

      <PersonalFinanceConfirmModal
        open={deleteTarget !== null}
        title="Excluir item"
        message={`Remover "${deleteTarget?.titulo}" da visão macro?`}
        confirmLabel="Excluir"
        danger
        onConfirm={() => {
          if (deleteTarget) void handleDelete(deleteTarget);
          setDeleteTarget(null);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
